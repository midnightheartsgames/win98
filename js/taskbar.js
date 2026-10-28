class Taskbar {
  constructor() {
    this.taskbarEl = document.getElementById('taskbar');
    this.startBtn = document.getElementById('start-button');
    this.startMenu = document.getElementById('start-menu');
    this.taskbarWindows = document.getElementById('taskbar-windows');
    this.clockEl = document.getElementById('tray-clock');
    this.trayEl = document.getElementById('taskbar-tray');

    this.windowButtons = new Map();
    this.quickLaunchEl = document.getElementById('quick-launch');
    this.desktopShownFrom = null;
    this.settings = this.loadSettings();
    this.initClock();
    this.initQuickLaunch();
    this.initStartMenu();
    this.initTray();
    this.initTaskbarContextMenu();
    this.initAutoHide();
    this.initLayering();
    this.applySettings();
    this.updateStartButton();

    if (window.i18n) {
      window.i18n.addListener(() => {
        this.updateLanguage();
      });
    }
  }

  updateStartButton() {
    const icon = this.startBtn ? this.startBtn.querySelector('.start-btn-icon') : null;
    if (icon && !icon.firstChild) icon.innerHTML = Icons['start-logo'];
    const span = this.startBtn ? this.startBtn.querySelector('span') : null;
    if (span && window.i18n) {
      span.textContent = window.i18n.t('taskbar.start');
    }
  }

  updateLanguage() {
    this.updateStartButton();
    this.renderStartMenuContent();
    this.renderQuickLaunch();
    this.updateTrayTooltips();
    this.updateClock();
  }

  initClock() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    if (this.clockEl) {
      this.clockEl.style.cursor = 'default';
      this.clockEl.addEventListener('dblclick', () => {
        if (window.appCPanel) window.appCPanel.openTimeDateProperties();
      });
    }
  }

  updateClock() {
    if (!this.clockEl) return;
    const now = new Date();
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let text;
    if (isRu) {
      text = `${now.getHours()}:${minutes}`;
    } else {
      const hours = now.getHours() % 12 || 12;
      text = `${hours}:${minutes} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    if (this.clockEl.textContent !== text) this.clockEl.textContent = text;
    const dateText = isRu
      ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)
      : new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now);
    if (this.clockEl.dataset.winTip !== undefined) this.clockEl.dataset.winTip = dateText;
    else if (this.clockEl.title !== dateText) this.clockEl.title = dateText;
  }

  initQuickLaunch() {
    if (!this.quickLaunchEl) return;
    this.renderQuickLaunch();
    this.quickLaunchEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-launch-btn');
      if (!btn) return;
      if (window.soundSys) window.soundSys.playClick();
      const target = btn.dataset.ql;
      if (target === 'desktop') this.toggleShowDesktop();
      else if (target === 'ie' && window.appIE) window.appIE.open();
      else if (target === 'outlook' && window.appOutlook) window.appOutlook.open();
    });
  }

  renderQuickLaunch() {
    if (!this.quickLaunchEl) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.quickLaunchEl.innerHTML = [
      ['desktop', 'show-desktop', t('taskbar.showDesktop')],
      ['ie', 'internet-explorer', t('taskbar.launchIE')],
      ['outlook', 'outlook', t('taskbar.launchOutlook')]
    ].map(([target, icon, title]) => `<button class="quick-launch-btn" data-ql="${target}" title="${title}">${Icons[icon] || ''}</button>`).join('');
  }

  toggleShowDesktop() {
    const wm = window.winManager;
    if (!wm) return;
    const visible = [...wm.windows.values()]
      .filter(w => !w.isMinimized && !w.element.classList.contains('is-dialog'))
      .sort((a, b) => (parseInt(a.element.style.zIndex, 10) || 0) - (parseInt(b.element.style.zIndex, 10) || 0));
    if (visible.length) {
      this.desktopShownFrom = visible.map(w => w.id);
      visible.forEach(w => wm.minimizeWindow(w.id));
    } else if (this.desktopShownFrom) {
      this.desktopShownFrom.forEach(id => {
        if (wm.windows.has(id)) wm.restoreWindow(id);
      });
      this.desktopShownFrom = null;
    }
  }

  initStartMenu() {
    this.startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleStartMenu();
    });

    document.addEventListener('click', (e) => {
      if (!this.startMenu.contains(e.target) && !this.startBtn.contains(e.target)) {
        this.closeStartMenu();
      }
    });

    document.addEventListener('keydown', (e) => this.onStartMenuKey(e), true);
    this.startMenu.addEventListener('mousemove', () => this.leaveKeyboardMode());

    if (window.gameManager) {
      window.gameManager.addListener(() => this.renderStartMenuContent());
    }

    this.renderStartMenuContent();
  }

  renderStartMenuContent() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const ru = window.i18n && window.i18n.getLanguage() === 'ru';

    this.startMenu.innerHTML = `
      <div class="start-menu-banner">
        <div class="start-menu-banner-text"><b>Win</b>98</div>
      </div>
      <div class="start-menu-items">
        <div class="start-menu-item" data-action="win-update">
          <div class="start-menu-item-icon">${Icons['win-update'] || Icons['internet-explorer']}</div>
          <div class="start-menu-item-text">${ru ? 'Обновление Win' : 'Win Update'}</div>
        </div>
        <div class="start-menu-separator"></div>
        <div class="start-menu-item" data-menu="programs">
          <div class="start-menu-item-icon">${Icons['programs']}</div>
          <div class="start-menu-item-text">${t('start.programs')}</div>
          <div class="start-menu-item-arrow"></div>
          <div class="start-submenu">
            <div class="start-menu-item" data-menu="accessories">
              <div class="start-menu-item-icon">${Icons['programs']}</div>
              <div class="start-menu-item-text">${t('start.accessories')}</div>
              <div class="start-menu-item-arrow"></div>
              <div class="start-submenu">
                <div class="start-menu-item" data-menu="communications">
                  <div class="start-menu-item-icon">${Icons['programs']}</div>
                  <div class="start-menu-item-text">${t('start.communications')}</div>
                  <div class="start-menu-item-arrow"></div>
                  <div class="start-submenu">
                    <div class="start-menu-item" data-action="dialup">
                      <div class="start-menu-item-icon">${Icons['dialup']}</div>
                      <div class="start-menu-item-text">${t('app.dialup')}</div>
                    </div>
                    <div class="start-menu-item" data-action="hypertrm">
                      <div class="start-menu-item-icon">${Icons['hypertrm']}</div>
                      <div class="start-menu-item-text">HyperTerminal (BBS)</div>
                    </div>
                    <div class="start-menu-item" data-action="mirc">
                      <div class="start-menu-item-icon">${Icons['mirc']}</div>
                      <div class="start-menu-item-text">mIRC 98 (RusNet IRC)</div>
                    </div>
                  </div>
                </div>
                <div class="start-menu-item" data-menu="entertainment">
                  <div class="start-menu-item-icon">${Icons['programs']}</div>
                  <div class="start-menu-item-text">${t('start.entertainment')}</div>
                  <div class="start-menu-item-arrow"></div>
                  <div class="start-submenu">
                    <div class="start-menu-item" data-action="cdplayer">
                      <div class="start-menu-item-icon">${Icons['cdplayer']}</div>
                      <div class="start-menu-item-text">${ru ? 'Лазерный проигрыватель' : 'CD Player'}</div>
                    </div>
                    <div class="start-menu-item" data-action="sound-recorder">
                      <div class="start-menu-item-icon">${Icons['sound-recorder']}</div>
                      <div class="start-menu-item-text">${t('app.soundRecorder')}</div>
                    </div>
                    <div class="start-menu-item" data-action="sndvol">
                      <div class="start-menu-item-icon">${Icons['volume-mixer']}</div>
                      <div class="start-menu-item-text">${t('start.volumeControl')}</div>
                    </div>
                    <div class="start-menu-item" data-action="cdex">
                      <div class="start-menu-item-icon">${Icons['cdex']}</div>
                      <div class="start-menu-item-text">CDex Audio CD Ripper</div>
                    </div>
                    <div class="start-menu-item" data-action="fasttracker">
                      <div class="start-menu-item-icon">${Icons['fasttracker']}</div>
                      <div class="start-menu-item-text">FastTracker 98 (.XM)</div>
                    </div>
                    <div class="start-menu-item" data-action="emulator">
                      <div class="start-menu-item-icon">${Icons['emulator']}</div>
                      <div class="start-menu-item-text">Emu-Land 98 (Dendy/Sega/SNES/GB)</div>
                    </div>
                  </div>
                </div>
                <div class="start-menu-item" data-menu="system-tools">
                  <div class="start-menu-item-icon">${Icons['programs']}</div>
                  <div class="start-menu-item-text">${t('start.systemTools')}</div>
                  <div class="start-menu-item-arrow"></div>
                  <div class="start-submenu">
                    <div class="start-menu-item" data-action="defrag">
                      <div class="start-menu-item-icon">${Icons['defrag']}</div>
                      <div class="start-menu-item-text">${t('app.defrag')}</div>
                    </div>
                    <div class="start-menu-item" data-action="msbackup">
                      <div class="start-menu-item-icon">${Icons['backup']}</div>
                      <div class="start-menu-item-text">${t('app.backup')}</div>
                    </div>
                    <div class="start-menu-item" data-action="bugreport">
                      <div class="start-menu-item-icon">${Icons['bugreport']}</div>
                      <div class="start-menu-item-text">${t('app.bugreport')}</div>
                    </div>
                    <div class="start-menu-item" data-action="bugreport-list">
                      <div class="start-menu-item-icon">${Icons['bugreport']}</div>
                      <div class="start-menu-item-text">${t('app.bugreportList')}</div>
                    </div>
                    <div class="start-menu-item" data-action="cleanmgr">
                      <div class="start-menu-item-icon">${Icons['cleanmgr']}</div>
                      <div class="start-menu-item-text">${t('app.cleanmgr')}</div>
                    </div>
                    <div class="start-menu-item" data-action="scandisk">
                      <div class="start-menu-item-icon">${Icons['scandisk']}</div>
                      <div class="start-menu-item-text">${t('start.scandisk')}</div>
                    </div>
                    <div class="start-menu-item" data-action="sysmon">
                      <div class="start-menu-item-icon">${Icons['sysmon']}</div>
                      <div class="start-menu-item-text">${ru ? 'Системный монитор' : 'System Monitor'}</div>
                    </div>
                    <div class="start-menu-item" data-action="clipbrd">
                      <div class="start-menu-item-icon">${Icons['clipbrd']}</div>
                      <div class="start-menu-item-text">${ru ? 'Просмотр буфера обмена' : 'Clipboard Viewer'}</div>
                    </div>
                    <div class="start-menu-item" data-action="charmap">
                      <div class="start-menu-item-icon">${Icons['charmap']}</div>
                      <div class="start-menu-item-text">${t('charmap.title')}</div>
                    </div>
                    <div class="start-menu-item" data-action="msconfig">
                      <div class="start-menu-item-icon">${Icons['msconfig']}</div>
                      <div class="start-menu-item-text">${t('msconfig.title')}</div>
                    </div>
                    <div class="start-menu-item" data-action="taskmgr">
                      <div class="start-menu-item-icon">${Icons['taskmgr']}</div>
                      <div class="start-menu-item-text">${t('taskmgr.title')}</div>
                    </div>
                    <div class="start-menu-item" data-action="msinfo32">
                      <div class="start-menu-item-icon">${Icons['msinfo32'] || Icons['msconfig']}</div>
                      <div class="start-menu-item-text">${ru ? 'Сведения о системе' : 'System Information'}</div>
                    </div>
                    <div class="start-menu-item" data-action="sfc">
                      <div class="start-menu-item-icon">${Icons['sfc'] || Icons['scandisk']}</div>
                      <div class="start-menu-item-text">${ru ? 'Проверка системных файлов' : 'System File Checker'}</div>
                    </div>
                    <div class="start-menu-item" data-action="scanreg">
                      <div class="start-menu-item-icon">${Icons['regedit']}</div>
                      <div class="start-menu-item-text">${ru ? 'Проверка реестра' : 'Registry Checker'}</div>
                    </div>
                    <div class="start-menu-item" data-action="scheduled-tasks">
                      <div class="start-menu-item-icon">${Icons['mstask'] || Icons['time']}</div>
                      <div class="start-menu-item-text">${ru ? 'Назначенные задания' : 'Scheduled Tasks'}</div>
                    </div>
                    <div class="start-menu-item" data-action="drvspace">
                      <div class="start-menu-item-icon">${Icons['drvspace'] || Icons['drive-c']}</div>
                      <div class="start-menu-item-text">DriveSpace</div>
                    </div>
                    <div class="start-menu-item" data-action="welcome">
                      <div class="start-menu-item-icon">${Icons['welcome'] || Icons['start-logo']}</div>
                      <div class="start-menu-item-text">${ru ? 'Добро пожаловать в Win 98' : 'Welcome to Win 98'}</div>
                    </div>
                    <div class="start-menu-item" data-action="wintune">
                      <div class="start-menu-item-icon">${Icons['wintune']}</div>
                      <div class="start-menu-item-text">Wintune 97 Benchmark</div>
                    </div>
                    <div class="start-menu-item" data-action="mon-test">
                      <div class="start-menu-item-icon">${Icons['mon-test']}</div>
                      <div class="start-menu-item-text">Nokia Monitor Tester</div>
                    </div>
                    <div class="start-menu-item" data-action="bios-setup">
                      <div class="start-menu-item-icon">${Icons['hardware']}</div>
                      <div class="start-menu-item-text">${t('start.biosSetup') || 'Настройка BIOS (CMOS Setup)'}</div>
                    </div>
                  </div>
                </div>
                <div class="start-menu-item" data-action="acdsee">
                  <div class="start-menu-item-icon">${Icons['acdsee']}</div>
                  <div class="start-menu-item-text">ACDSee 32 v2.23</div>
                </div>
                <div class="start-menu-item" data-action="acrobat">
                  <div class="start-menu-item-icon">${Icons['acrobat']}</div>
                  <div class="start-menu-item-text">Adobe Acrobat Reader 3.01</div>
                </div>
                <div class="start-menu-item" data-action="imaging">
                  <div class="start-menu-item-icon">${Icons['imaging']}</div>
                  <div class="start-menu-item-text">${t('app.imaging') || 'Imaging'}</div>
                </div>
                <div class="start-menu-item" data-action="paint">
                  <div class="start-menu-item-icon">${Icons['paint']}</div>
                  <div class="start-menu-item-text">${t('app.paint')}</div>
                </div>
                <div class="start-menu-item" data-action="wordpad">
                  <div class="start-menu-item-icon">${Icons['wordpad']}</div>
                  <div class="start-menu-item-text">${t('app.wordpad')}</div>
                </div>
                <div class="start-menu-item" data-action="notepad">
                  <div class="start-menu-item-icon">${Icons['notepad']}</div>
                  <div class="start-menu-item-text">${t('app.notepad')}</div>
                </div>
                <div class="start-menu-item" data-action="qbasic">
                  <div class="start-menu-item-icon">${Icons['qbasic']}</div>
                  <div class="start-menu-item-text">Microslop QBasic 1.1</div>
                </div>
                <div class="start-menu-item" data-action="calc">
                  <div class="start-menu-item-icon">${Icons['calculator']}</div>
                  <div class="start-menu-item-text">${t('app.calculator')}</div>
                </div>
                <div class="start-menu-item" data-action="neko">
                  <div class="start-menu-item-icon">${Icons['neko']}</div>
                  <div class="start-menu-item-text">${t('app.neko')}</div>
                </div>
              </div>
            </div>
            <div class="start-menu-item" data-menu="games">
              <div class="start-menu-item-icon">${Icons['programs']}</div>
              <div class="start-menu-item-text">${t('start.games')}</div>
              <div class="start-menu-item-arrow"></div>
              <div class="start-submenu">
                <div class="start-menu-item" data-action="minesweeper">
                  <div class="start-menu-item-icon">${Icons['minesweeper']}</div>
                  <div class="start-menu-item-text">${t('app.minesweeper')}</div>
                </div>
                <div class="start-menu-item" data-action="solitaire">
                  <div class="start-menu-item-icon">${Icons['solitaire']}</div>
                  <div class="start-menu-item-text">${t('app.solitaire')}</div>
                </div>
                <div class="start-menu-item" data-action="freecell">
                  <div class="start-menu-item-icon">${Icons['freecell']}</div>
                  <div class="start-menu-item-text">${t('app.freecell')}</div>
                </div>
                <div class="start-menu-item" data-action="pinball">
                  <div class="start-menu-item-icon">${Icons['pinball']}</div>
                  <div class="start-menu-item-text">${t('app.pinball')}</div>
                </div>
                <div class="start-menu-item" data-action="hearts">
                  <div class="start-menu-item-icon">${Icons['hearts'] || Icons['solitaire']}</div>
                  <div class="start-menu-item-text">The Microslop Hearts Network</div>
                </div>
                ${(window.gameManager && window.gameManager.isInstalled('wolf3d')) ? `
                <div class="start-menu-item" data-action="wolf3d">
                  <div class="start-menu-item-icon">${Icons['wolf3d']}</div>
                  <div class="start-menu-item-text">Wolfenstein 3D</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('quest_demo')) ? `
                <div class="start-menu-item" data-action="quest_demo">
                  <div class="start-menu-item-icon">${Icons['lucas-quest']}</div>
                  <div class="start-menu-item-text">LucasQuest 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('stalker')) ? `
                <div class="start-menu-item" data-action="stalker">
                  <div class="start-menu-item-icon">${Icons['stalker']}</div>
                  <div class="start-menu-item-text">S.T.A.L.K.E.R.</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('fallout98_demo')) ? `
                <div class="start-menu-item" data-action="fallout98_demo">
                  <div class="start-menu-item-icon">${Icons['fallout2']}</div>
                  <div class="start-menu-item-text">Fallout 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('burnout')) ? `
                <div class="start-menu-item" data-action="burnout">
                  <div class="start-menu-item-icon">${Icons['burnout']}</div>
                  <div class="start-menu-item-text">Burnout Drag Racing Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('doom')) ? `
                <div class="start-menu-item" data-action="doom">
                  <div class="start-menu-item-icon">${Icons['doom']}</div>
                  <div class="start-menu-item-text">DOOM 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('serioussam')) ? `
                <div class="start-menu-item" data-action="serioussam">
                  <div class="start-menu-item-icon">${Icons['serioussam']}</div>
                  <div class="start-menu-item-text">Serious Sam 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('stalker98_demo')) ? `
                <div class="start-menu-item" data-action="stalker98_demo">
                  <div class="start-menu-item-icon">${Icons['stalker98']}</div>
                  <div class="start-menu-item-text">S.T.A.L.K.E.R. 98: Тень Чернобыля Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('cop98')) ? `
                <div class="start-menu-item" data-action="cop98">
                  <div class="start-menu-item-icon">${Icons['cop98']}</div>
                  <div class="start-menu-item-text">S.T.A.L.K.E.R.: Зов Припяти 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('mc98_demo')) ? `
                <div class="start-menu-item" data-action="mc98_demo">
                  <div class="start-menu-item-icon">${Icons['mc98']}</div>
                  <div class="start-menu-item-text">Minecraft 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('hsr98')) ? `
                <div class="start-menu-item" data-action="hsr98">
                  <div class="start-menu-item-icon">${Icons['hsr98']}</div>
                  <div class="start-menu-item-text">Honkai: Star Rail 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('dao98_demo')) ? `
                <div class="start-menu-item" data-action="dao98_demo">
                  <div class="start-menu-item-icon">${Icons['dao98']}</div>
                  <div class="start-menu-item-text">Dragon Age: Origins 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('dmc98_demo')) ? `
                <div class="start-menu-item" data-action="dmc98_demo">
                  <div class="start-menu-item-icon">${Icons['dmc98']}</div>
                  <div class="start-menu-item-text">Devil May Cry 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('tekken98_demo')) ? `
                <div class="start-menu-item" data-action="tekken98_demo">
                  <div class="start-menu-item-icon">${Icons['tekken3']}</div>
                  <div class="start-menu-item-text">Tekken 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('ow98')) ? `
                <div class="start-menu-item" data-action="ow98">
                  <div class="start-menu-item-icon">${Icons['ow98']}</div>
                  <div class="start-menu-item-text">Overwatch 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax')) ? `
                <div class="start-menu-item" data-action="sammax">
                  <div class="start-menu-item-icon">${Icons['sammax']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Culture Shock</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax102')) ? `
                <div class="start-menu-item" data-action="sammax102">
                  <div class="start-menu-item-icon">${Icons['sammax102']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Situation: Comedy</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax103')) ? `
                <div class="start-menu-item" data-action="sammax103">
                  <div class="start-menu-item-icon">${Icons['sammax103']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: The Mole, the Mob and the Meatball</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax104')) ? `
                <div class="start-menu-item" data-action="sammax104">
                  <div class="start-menu-item-icon">${Icons['sammax104']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Abe Lincoln Must Die!</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax105')) ? `
                <div class="start-menu-item" data-action="sammax105">
                  <div class="start-menu-item-icon">${Icons['sammax105']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Reality 2.0</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax106')) ? `
                <div class="start-menu-item" data-action="sammax106">
                  <div class="start-menu-item-icon">${Icons['sammax106']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Bright Side of the Moon</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax201')) ? `
                <div class="start-menu-item" data-action="sammax201">
                  <div class="start-menu-item-icon">${Icons['sammax201']}</div>
                  <div class="start-menu-item-text">Sam &amp; Max: Ice Station Santa</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sammax202_demo')) ? `
                <div class="start-menu-item" data-action="sammax202_demo">
                  <div class="start-menu-item-icon">${Icons['sammax202']}</div>
                  <div class="start-menu-item-text">Sam & Max: Moai Better Blues Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('bttf')) ? `
                <div class="start-menu-item" data-action="bttf">
                  <div class="start-menu-item-icon">${Icons['bttf']}</div>
                  <div class="start-menu-item-text">Back to the Future: The Game</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('diablo2')) ? `
                <div class="start-menu-item" data-action="diablo2">
                  <div class="start-menu-item-icon">${Icons['diablo2']}</div>
                  <div class="start-menu-item-text">Diablo II</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('forza')) ? `
                <div class="start-menu-item" data-action="forza">
                  <div class="start-menu-item-icon">${Icons['forza']}</div>
                  <div class="start-menu-item-text">Forza Horizon: Рига</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('xiii_demo')) ? `
                <div class="start-menu-item" data-action="xiii_demo">
                  <div class="start-menu-item-icon">${Icons['xiii']}</div>
                  <div class="start-menu-item-text">XIII Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('maxpayne_demo')) ? `
                <div class="start-menu-item" data-action="maxpayne_demo">
                  <div class="start-menu-item-icon">${Icons['maxpayne']}</div>
                  <div class="start-menu-item-text">Max Payne Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('gtann')) ? `
                <div class="start-menu-item" data-action="gtann">
                  <div class="start-menu-item-icon">${Icons['gtann']}</div>
                  <div class="start-menu-item-text">GTA: Нижний Сити</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('legion')) ? `
                <div class="start-menu-item" data-action="legion">
                  <div class="start-menu-item-icon">${Icons['legion']}</div>
                  <div class="start-menu-item-text">Legion Arena</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('homm1_demo')) ? `
                <div class="start-menu-item" data-action="homm1_demo">
                  <div class="start-menu-item-icon">${Icons['homm1']}</div>
                  <div class="start-menu-item-text">Heroes of Might and Magic 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('anotherwar')) ? `
                <div class="start-menu-item" data-action="anotherwar">
                  <div class="start-menu-item-icon">${Icons['anotherwar']}</div>
                  <div class="start-menu-item-text">Another War</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('fallout')) ? `
                <div class="start-menu-item" data-action="fallout">
                  <div class="start-menu-item-icon">${Icons['fallout']}</div>
                  <div class="start-menu-item-text">Fallout</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('falloutzp_demo')) ? `
                <div class="start-menu-item" data-action="falloutzp_demo">
                  <div class="start-menu-item-icon">${Icons['falloutzp']}</div>
                  <div class="start-menu-item-text">Fallout: Запорожье Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('korovany_demo')) ? `
                <div class="start-menu-item" data-action="korovany_demo">
                  <div class="start-menu-item-icon">${Icons['korovany']}</div>
                  <div class="start-menu-item-text">Корованы Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('catniss')) ? `
                <div class="start-menu-item" data-action="catniss">
                  <div class="start-menu-item-icon">${Icons['catniss']}</div>
                  <div class="start-menu-item-text">Catniss</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('plov')) ? `
                <div class="start-menu-item" data-action="plov">
                  <div class="start-menu-item-icon">${Icons['plov']}</div>
                  <div class="start-menu-item-text">Хаято, Где плов?</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('sims3')) ? `
                <div class="start-menu-item" data-action="sims3">
                  <div class="start-menu-item-icon">${Icons['sims3']}</div>
                  <div class="start-menu-item-text">The Sims 3</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('kotor98_demo')) ? `
                <div class="start-menu-item" data-action="kotor98_demo">
                  <div class="start-menu-item-icon">${Icons['kotor98']}</div>
                  <div class="start-menu-item-text">Star Wars: Knights of the Old Republic 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('hl2_demo')) ? `
                <div class="start-menu-item" data-action="hl2_demo">
                  <div class="start-menu-item-icon">${Icons['hl2']}</div>
                  <div class="start-menu-item-text">Half-Life 2 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('quake3')) ? `
                <div class="start-menu-item" data-action="quake3">
                  <div class="start-menu-item-icon">${Icons['quake3']}</div>
                  <div class="start-menu-item-text">Quake III Arena</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('gta90')) ? `
                <div class="start-menu-item" data-action="gta90">
                  <div class="start-menu-item-icon">${Icons['gta90']}</div>
                  <div class="start-menu-item-text">GTA: Екатеринбург '90</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('moh98')) ? `
                <div class="start-menu-item" data-action="moh98">
                  <div class="start-menu-item-icon">${Icons['moh98']}</div>
                  <div class="start-menu-item-text">Medal of Honor 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('lol')) ? `
                <div class="start-menu-item" data-action="lol">
                  <div class="start-menu-item-icon">${Icons['lol']}</div>
                  <div class="start-menu-item-text">League of Legends 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('avatar98')) ? `
                <div class="start-menu-item" data-action="avatar98">
                  <div class="start-menu-item-icon">${Icons['avatar98']}</div>
                  <div class="start-menu-item-text">Аватар: Тихий цикл</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('dota')) ? `
                <div class="start-menu-item" data-action="dota">
                  <div class="start-menu-item-icon">${Icons['dota']}</div>
                  <div class="start-menu-item-text">Dota 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('diablo')) ? `
                <div class="start-menu-item" data-action="diablo">
                  <div class="start-menu-item-icon">${Icons['diablo']}</div>
                  <div class="start-menu-item-text">Diablo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('hockey')) ? `
                <div class="start-menu-item" data-action="hockey">
                  <div class="start-menu-item-icon">${Icons['hockey']}</div>
                  <div class="start-menu-item-text">NHL 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('worldcup98')) ? `
                <div class="start-menu-item" data-action="worldcup98">
                  <div class="start-menu-item-icon">${Icons['worldcup98']}</div>
                  <div class="start-menu-item-text">World Cup 98</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('half-life_demo')) ? `
                <div class="start-menu-item" data-action="half-life_demo">
                  <div class="start-menu-item-icon">${Icons['half-life']}</div>
                  <div class="start-menu-item-text">Half-Life 98 Demo</div>
                </div>` : ''}
                ${(window.gameManager && window.gameManager.isInstalled('neon-racer_demo')) ? `
                <div class="start-menu-item" data-action="neon-racer_demo">
                  <div class="start-menu-item-icon">${Icons['burnout']}</div>
                  <div class="start-menu-item-text">Midnight Glide Demo</div>
                </div>` : ''}
              </div>
            </div>
            <div class="start-menu-item" data-action="winrar">
              <div class="start-menu-item-icon">${Icons['winrar']}</div>
              <div class="start-menu-item-text">${t('app.winrar')}</div>
            </div>
            ${(window.gameManager && window.gameManager.isInstalled('avp')) ? `
            <div class="start-menu-item" data-action="avp">
              <div class="start-menu-item-icon">${Icons['avp']}</div>
              <div class="start-menu-item-text">${t('app.avp')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('videoplayer')) ? `
            <div class="start-menu-item" data-action="videoplayer">
              <div class="start-menu-item-icon">${Icons['video-player']}</div>
              <div class="start-menu-item-text">${t('app.videoplayer')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('photoshop')) ? `
            <div class="start-menu-item" data-action="photoshop">
              <div class="start-menu-item-icon">${Icons['photoshop']}</div>
              <div class="start-menu-item-text">${t('app.photoshop')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('wincommander')) ? `
            <div class="start-menu-item" data-action="wincommander">
              <div class="start-menu-item-icon">${Icons['wincommander']}</div>
              <div class="start-menu-item-text">${t('app.wincommander')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('winamp')) ? `
            <div class="start-menu-item" data-action="winamp">
              <div class="start-menu-item-icon">${Icons['winamp']}</div>
              <div class="start-menu-item-text">${t('app.winamp')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('blender')) ? `
            <div class="start-menu-item" data-action="blender">
              <div class="start-menu-item-icon">${Icons['blender']}</div>
              <div class="start-menu-item-text">${t('app.blender')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('blender204')) ? `
            <div class="start-menu-item" data-action="blender204">
              <div class="start-menu-item-icon">${Icons['blender204']}</div>
              <div class="start-menu-item-text">${t('app.blender204')}</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('steam')) ? `
            <div class="start-menu-item" data-action="steam">
              <div class="start-menu-item-icon">${Icons['steam']}</div>
              <div class="start-menu-item-text">Steam</div>
            </div>` : ''}
            ${(window.gameManager && window.gameManager.isInstalled('esheep')) ? `
            <div class="start-menu-item" data-action="esheep">
              <div class="start-menu-item-icon">${Icons['esheep']}</div>
              <div class="start-menu-item-text">${t('app.esheep')}</div>
            </div>` : ''}
            <div class="start-menu-separator"></div>
            <div class="start-menu-item" data-action="icq">
              <div class="start-menu-item-icon">${Icons['icq-online']}</div>
              <div class="start-menu-item-text">ICQ 98a</div>
            </div>
            <div class="start-menu-item" data-action="outlook">
              <div class="start-menu-item-icon">${Icons['outlook']}</div>
              <div class="start-menu-item-text">Outlook Express</div>
            </div>
            <div class="start-menu-item" data-action="explorer-tree">
              <div class="start-menu-item-icon">${Icons['tb-folders'] || Icons['folder']}</div>
              <div class="start-menu-item-text">${ru ? 'Проводник' : 'Win Explorer'}</div>
            </div>
            <div class="start-menu-item" data-action="dos-prompt">
              <div class="start-menu-item-icon">${Icons['dos-prompt']}</div>
              <div class="start-menu-item-text">${ru ? 'Сеанс MS-DOS' : 'MS-DOS Prompt'}</div>
            </div>
            <div class="start-menu-item" data-action="regedit">
              <div class="start-menu-item-icon">${Icons['regedit']}</div>
              <div class="start-menu-item-text">${t('app.regedit')}</div>
            </div>
            <div class="start-menu-separator"></div>
            <div class="start-menu-item" data-action="ie">
              <div class="start-menu-item-icon">${Icons['internet-explorer']}</div>
              <div class="start-menu-item-text">${t('app.ie')}</div>
            </div>
            <div class="start-menu-item" data-action="netscape">
              <div class="start-menu-item-icon">${Icons['netscape']}</div>
              <div class="start-menu-item-text">${t('app.netscape')}</div>
            </div>
            <div class="start-menu-item" data-action="digicharat">
              <div class="start-menu-item-icon">${Icons['digicharat'] || Icons['internet-explorer']}</div>
              <div class="start-menu-item-text">${t('app.digicharat')}</div>
            </div>
          </div>
        </div>

        <div class="start-menu-item" data-menu="documents">
          <div class="start-menu-item-icon">${Icons['my-documents']}</div>
          <div class="start-menu-item-text">${t('start.documents')}</div>
          <div class="start-menu-item-arrow"></div>
          <div class="start-submenu">
            <div class="start-menu-item" data-action="my-docs">
              <div class="start-menu-item-icon">${Icons['my-documents']}</div>
              <div class="start-menu-item-text">${t('app.myDocs')}</div>
            </div>
            <div class="start-menu-item" data-action="my-pictures">
              <div class="start-menu-item-icon">${Icons['folder-pictures']}</div>
              <div class="start-menu-item-text">${t('app.myPictures')}</div>
            </div>
            <div class="start-menu-item" data-action="my-music">
              <div class="start-menu-item-icon">${Icons['folder-music']}</div>
              <div class="start-menu-item-text">${t('app.myMusic')}</div>
            </div>
            <div class="start-menu-item" data-action="my-videos">
              <div class="start-menu-item-icon">${Icons['folder-videos']}</div>
              <div class="start-menu-item-text">${t('app.myVideos')}</div>
            </div>
            <div class="start-menu-item" data-action="my-downloads">
              <div class="start-menu-item-icon">${Icons['folder-downloads'] || Icons['folder']}</div>
              <div class="start-menu-item-text">${t('app.myDownloads')}</div>
            </div>
          </div>
        </div>

        <div class="start-menu-item" data-menu="settings">
          <div class="start-menu-item-icon">${Icons['settings']}</div>
          <div class="start-menu-item-text">${t('start.settings')}</div>
          <div class="start-menu-item-arrow"></div>
          <div class="start-submenu">
            <div class="start-menu-item" data-action="control-panel">
              <div class="start-menu-item-icon">${Icons['control-panel']}</div>
              <div class="start-menu-item-text">${t('start.controlPanel')}</div>
            </div>
            <div class="start-menu-item" data-action="printers">
              <div class="start-menu-item-icon">${Icons['printers'] || Icons['control-panel']}</div>
              <div class="start-menu-item-text">${ru ? 'Принтеры' : 'Printers'}</div>
            </div>
            <div class="start-menu-item" data-action="taskbar-props">
              <div class="start-menu-item-icon">${Icons['taskbar-props']}</div>
              <div class="start-menu-item-text">${t('start.taskbarProps')}</div>
            </div>
            <div class="start-menu-item" data-action="folder-options">
              <div class="start-menu-item-icon">${Icons['folder']}</div>
              <div class="start-menu-item-text">${ru ? 'Свойства папки...' : 'Folder Options...'}</div>
            </div>
            <div class="start-menu-item" data-action="active-desktop">
              <div class="start-menu-item-icon">${Icons['internet-explorer']}</div>
              <div class="start-menu-item-text">Active Desktop</div>
            </div>
            <div class="start-menu-item" data-action="win-update">
              <div class="start-menu-item-icon">${Icons['win-update'] || Icons['internet-explorer']}</div>
              <div class="start-menu-item-text">${ru ? 'Обновление Win' : 'Win Update'}</div>
            </div>
            <div class="start-menu-item" data-action="regional-settings">
              <div class="start-menu-item-icon">${Icons['regional']}</div>
              <div class="start-menu-item-text">${t('start.regionalSettings')}</div>
            </div>
            <div class="start-menu-item" data-action="properties">
              <div class="start-menu-item-icon">${Icons['monitor']}</div>
              <div class="start-menu-item-text">${t('start.displayProps')}</div>
            </div>
          </div>
        </div>

        <div class="start-menu-item" data-menu="find">
          <div class="start-menu-item-icon">${Icons['find']}</div>
          <div class="start-menu-item-text">${t('start.find')}</div>
          <div class="start-menu-item-arrow"></div>
          <div class="start-submenu">
            <div class="start-menu-item" data-action="find">
              <div class="start-menu-item-icon">${Icons['find']}</div>
              <div class="start-menu-item-text">${t('start.findFiles')}</div>
            </div>
            <div class="start-menu-item" data-action="find-web">
              <div class="start-menu-item-icon">${Icons['internet-explorer']}</div>
              <div class="start-menu-item-text">${t('start.findWeb')}</div>
            </div>
          </div>
        </div>

        <div class="start-menu-item" data-action="help">
          <div class="start-menu-item-icon">${Icons['help']}</div>
          <div class="start-menu-item-text">${t('start.help')}</div>
        </div>

        <div class="start-menu-item" data-action="run">
          <div class="start-menu-item-icon">${Icons['run']}</div>
          <div class="start-menu-item-text">${t('start.run')}</div>
        </div>

        <div class="start-menu-separator"></div>

        <div class="start-menu-item" data-action="logoff">
          <div class="start-menu-item-icon">${Icons['users'] || Icons['shut-down']}</div>
          <div class="start-menu-item-text">${ru ? 'Завершение сеанса Administrator...' : 'Log Off Administrator...'}</div>
        </div>

        <div class="start-menu-item" data-action="shutdown">
          <div class="start-menu-item-icon">${Icons['shut-down']}</div>
          <div class="start-menu-item-text">${t('start.shutdown')}</div>
        </div>
      </div>
    `;

    this.applyStartMenuFolder();
    this.appendRecentDocuments();

    this.startMenu.querySelectorAll('.start-menu-item[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeStartMenu();
        this.handleStartAction(el.dataset.action);
      });
    });

    this.startMenu.querySelectorAll('.start-menu-item[data-link]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeStartMenu();
        this.openStartMenuLink(this.startMenuLinks[Number(el.dataset.link)]);
      });
    });

    this.startMenu.querySelectorAll('.start-menu-item.is-empty').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });

    this.startMenu.querySelectorAll('.start-menu-item[data-menu]').forEach(el => {
      el.addEventListener('mouseenter', () => this.placeSubmenu(el));
    });

    this.markAccelerators();
  }

  markAccelerators() {
    this.startMenu.querySelectorAll('.start-menu-items, .start-submenu').forEach(list => {
      const used = new Set();
      [...list.children].filter(el => el.classList.contains('start-menu-item')).forEach(item => {
        const textEl = item.querySelector(':scope > .start-menu-item-text');
        if (!textEl) return;
        const label = textEl.textContent;
        const index = label.split('').findIndex(ch => /[\p{L}\d]/u.test(ch) && !used.has(ch.toLowerCase()));
        if (index < 0) return;
        const letter = label[index];
        used.add(letter.toLowerCase());
        item.dataset.accel = letter.toLowerCase();
        const accel = document.createElement('span');
        accel.className = 'win-accel';
        accel.textContent = letter;
        textEl.textContent = '';
        textEl.append(label.slice(0, index), accel, label.slice(index + 1));
      });
    });
  }

  placeSubmenu(item) {
    const sub = item.querySelector(':scope > .start-submenu');
    if (!sub) return;
    sub.classList.remove('is-columns', 'opens-left');
    sub.style.top = '';
    sub.style.gridTemplateRows = '';
    let rect = sub.getBoundingClientRect();
    if (!rect.height) return;
    const limit = window.innerHeight - (this.taskbarEl ? this.taskbarEl.offsetHeight : 28);
    if (rect.height > limit) {
      const firstItem = sub.querySelector(':scope > .start-menu-item');
      const rowHeight = firstItem ? firstItem.offsetHeight : 22;
      sub.classList.add('is-columns');
      sub.style.gridTemplateRows = `repeat(${Math.max(1, Math.floor((limit - 6) / rowHeight))}, auto)`;
      rect = sub.getBoundingClientRect();
    }
    const itemTop = item.getBoundingClientRect().top;
    if (rect.bottom > limit) {
      sub.style.top = `${Math.max(-itemTop, limit - rect.height - itemTop)}px`;
    }
    if (rect.right > window.innerWidth) sub.classList.add('opens-left');
  }

  leaveKeyboardMode() {
    if (!this.startMenu.classList.contains('kb-mode')) return;
    this.startMenu.classList.remove('kb-mode');
    this.startMenu.querySelectorAll('.kb-focus, .kb-open').forEach(el => el.classList.remove('kb-focus', 'kb-open'));
  }

  onStartMenuKey(e) {
    if (!this.startMenu.classList.contains('open')) return;
    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'];
    const isLetter = e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
    if (!navKeys.includes(e.key) && !isLetter) return;
    e.preventDefault();
    e.stopPropagation();
    this.startMenu.classList.add('kb-mode');

    const focused = this.startMenu.querySelector('.start-menu-item.kb-focus');
    const list = focused ? focused.parentElement : this.startMenu.querySelector('.start-menu-items');
    const items = [...list.children].filter(el => el.classList.contains('start-menu-item'));
    const index = items.indexOf(focused);
    const parentItem = list.classList.contains('start-submenu') ? list.parentElement : null;

    const focus = (item) => {
      this.startMenu.querySelectorAll('.kb-focus').forEach(el => el.classList.remove('kb-focus'));
      if (item) item.classList.add('kb-focus');
    };
    const openSubmenu = (item) => {
      item.classList.add('kb-open');
      this.placeSubmenu(item);
      focus(item.querySelector(':scope > .start-submenu > .start-menu-item'));
    };
    const activate = (item) => {
      if (item.dataset.menu) openSubmenu(item);
      else item.click();
    };

    if (e.key === 'ArrowDown') {
      focus(items[(index + 1) % items.length]);
    } else if (e.key === 'ArrowUp') {
      focus(items[index <= 0 ? items.length - 1 : index - 1]);
    } else if (e.key === 'ArrowRight') {
      if (focused && focused.dataset.menu) openSubmenu(focused);
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      if (parentItem) {
        parentItem.classList.remove('kb-open');
        focus(parentItem);
      } else if (e.key === 'Escape') {
        this.closeStartMenu();
      }
    } else if (e.key === 'Enter') {
      if (focused) activate(focused);
    } else {
      const matches = items.filter(item => item.dataset.accel === e.key.toLowerCase());
      if (matches.length === 1) activate(matches[0]);
      else if (matches.length > 1) focus(matches[(matches.indexOf(focused) + 1) % matches.length]);
    }
  }

  toggleStartMenu() {
    if (this.startMenu.classList.contains('open')) {
      this.closeStartMenu();
    } else {
      this.renderStartMenuContent();
      this.revealTaskbar();
      this.raiseTaskbar(true);
      this.startMenu.classList.add('open');
      this.startBtn.classList.add('active');
    }
    if (window.soundSys) window.soundSys.playClick();
  }

  closeStartMenu() {
    const wasOpen = this.startMenu.classList.contains('open');
    this.startMenu.classList.remove('open', 'kb-mode');
    this.startBtn.classList.remove('active');
    this.startMenu.querySelectorAll('.kb-focus, .kb-open').forEach(el => el.classList.remove('kb-focus', 'kb-open'));
    if (wasOpen) this.scheduleAutoHide();
  }

  handleStartAction(action) {
    if (window.soundSys) window.soundSys.playClick();

    switch (action) {
      case 'dialup':
        if (window.appDialUp) window.appDialUp.open();
        break;
      case 'winrar':
        if (window.appWinRAR) window.appWinRAR.open();
        break;
      case 'avp':
        if (window.gameManager && !window.gameManager.isInstalled('avp')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: t('app.avp'),
            icon: 'error',
            message: t('store.appNotInstalled', t('app.avp'))
          });
        } else if (window.appAVP) {
          window.appAVP.open();
        }
        break;
      case 'esheep':
        if (window.gameManager && !window.gameManager.isInstalled('esheep')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: t('app.esheep'),
            icon: 'error',
            message: t('store.appNotInstalled', t('app.esheep'))
          });
        } else if (window.appESheep) {
          window.appESheep.open();
        }
        break;
      case 'freecell':
        if (window.appFreeCell) window.appFreeCell.open();
        break;
      case 'wordpad':
        if (window.appWordPad) window.appWordPad.open();
        break;
      case 'neko':
        if (window.appNeko) window.appNeko.toggle();
        break;
      case 'hockey':
        if (window.gameManager && !window.gameManager.isInstalled('hockey')) {
          const isRu = (window.i18n ? window.i18n.currentLang : 'ru') === 'ru';
          window.winManager.openDialog({
            title: 'NHL 98',
            icon: 'error',
            message: isRu
              ? 'Игра NHL 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\nhl98demo.exe).'
              : 'Game NHL 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\nhl98demo.exe).'
          });
        } else if (window.appHockey) {
          window.appHockey.open();
        }
        break;
      case 'worldcup98':
        if (window.gameManager && !window.gameManager.isInstalled('worldcup98')) {
          const isRu = (window.i18n ? window.i18n.currentLang : 'ru') === 'ru';
          window.winManager.openDialog({
            title: 'World Cup 98',
            icon: 'error',
            message: isRu
              ? 'Игра World Cup 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\worldcup98.exe).'
              : 'Game World Cup 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\worldcup98.exe).'
          });
        } else if (window.appWorldCup98) {
          window.appWorldCup98.open();
        }
        break;
      case 'doom':
        if (window.gameManager && !window.gameManager.isInstalled('doom')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'DOOM 98', icon: 'error', message: t('store.gameNotInstalled', 'DOOM 98') });
        } else if (window.appDoom) {
          window.appDoom.open();
        }
        break;
      case 'avatar98':
        if (window.gameManager && !window.gameManager.isInstalled('avatar98')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Аватар: Тихий цикл', icon: 'error', message: t('store.gameNotInstalled', 'Аватар: Тихий цикл') });
        } else if (window.appAvatar98) {
          window.appAvatar98.open();
        }
        break;
      case 'dota':
        if (window.gameManager && !window.gameManager.isInstalled('dota')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Dota 98', icon: 'error', message: t('store.gameNotInstalled', 'Dota 98') });
        } else if (window.appDota) {
          window.appDota.open();
        }
        break;
      case 'lol':
        if (window.gameManager && !window.gameManager.isInstalled('lol')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'League of Legends 98', icon: 'error', message: t('store.gameNotInstalled', 'League of Legends 98') });
        } else if (window.appLoL) {
          window.appLoL.open();
        }
        break;
      case 'cop98':
        if (window.gameManager && !window.gameManager.isInstalled('cop98')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'S.T.A.L.K.E.R.: Зов Припяти 98', icon: 'error', message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.: Зов Припяти 98') });
        } else if (window.appCop98) {
          window.appCop98.open();
        }
        break;
      case 'dao98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('dao98_demo')) {
          window.gameManager.showOnCd('dao98_demo');
        } else if (window.appDao98) {
          window.appDao98.open();
        }
        break;
      case 'dmc98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('dmc98_demo')) {
          window.gameManager.showOnCd('dmc98_demo');
        } else if (window.appDmc98) {
          window.appDmc98.open();
        }
        break;
      case 'tekken98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('tekken98_demo')) {
          window.gameManager.showOnCd('tekken98_demo');
        } else if (window.appTekken3) {
          window.appTekken3.open();
        }
        break;
      case 'ow98':
        if (window.gameManager && !window.gameManager.isInstalled('ow98')) {
          window.gameManager.showInSteam('ow98');
        } else if (window.appOw98) {
          window.appOw98.open();
        }
        break;
      case 'sammax':
        if (window.gameManager && !window.gameManager.isInstalled('sammax')) {
          window.gameManager.showInSteam('sammax');
        } else if (window.appSamMax) {
          window.appSamMax.open();
        }
        break;
      case 'sammax102':
        if (window.gameManager && !window.gameManager.isInstalled('sammax102')) {
          window.gameManager.showInSteam('sammax102');
        } else if (window.appSamMax102) {
          window.appSamMax102.open();
        }
        break;
      case 'sammax103':
        if (window.gameManager && !window.gameManager.isInstalled('sammax103')) {
          window.gameManager.showInSteam('sammax103');
        } else if (window.appSamMax103) {
          window.appSamMax103.open();
        }
        break;
      case 'sammax104':
        if (window.gameManager && !window.gameManager.isInstalled('sammax104')) {
          window.gameManager.showInSteam('sammax104');
        } else if (window.appSamMax104) {
          window.appSamMax104.open();
        }
        break;
      case 'sammax105':
        if (window.gameManager && !window.gameManager.isInstalled('sammax105')) {
          window.gameManager.showInSteam('sammax105');
        } else if (window.appSamMax105) {
          window.appSamMax105.open();
        }
        break;
      case 'sammax106':
        if (window.gameManager && !window.gameManager.isInstalled('sammax106')) {
          window.gameManager.showInSteam('sammax106');
        } else if (window.appSamMax106) {
          window.appSamMax106.open();
        }
        break;
      case 'sammax201':
        if (window.gameManager && !window.gameManager.isInstalled('sammax201')) {
          window.gameManager.showInSteam('sammax201');
        } else if (window.appSamMax201) {
          window.appSamMax201.open();
        }
        break;
      case 'sammax202_demo':
        if (window.gameManager && !window.gameManager.isInstalled('sammax202_demo')) {
          window.gameManager.showOnCd('sammax202_demo');
        } else if (window.appSamMax202) {
          window.appSamMax202.open();
        }
        break;
      case 'bttf':
        if (window.gameManager && !window.gameManager.isInstalled('bttf')) {
          window.gameManager.showInSteam('bttf');
        } else if (window.appBTTF) {
          window.appBTTF.open();
        }
        break;
      case 'diablo2':
        if (window.gameManager && !window.gameManager.isInstalled('diablo2')) {
          window.gameManager.showInSteam('diablo2');
        } else if (window.appDiablo2) {
          window.appDiablo2.open();
        }
        break;
      case 'forza':
        if (window.gameManager && !window.gameManager.isInstalled('forza')) {
          window.gameManager.showInSteam('forza');
        } else if (window.appForza) {
          window.appForza.open();
        }
        break;
      case 'xiii_demo':
        if (window.gameManager && !window.gameManager.isInstalled('xiii_demo')) {
          window.gameManager.showOnCd('xiii_demo');
        } else if (window.appXiii) {
          window.appXiii.open();
        }
        break;
      case 'maxpayne_demo':
        if (window.gameManager && !window.gameManager.isInstalled('maxpayne_demo')) {
          window.gameManager.showOnCd('maxpayne_demo');
        } else if (window.appMaxPayne) {
          window.appMaxPayne.open();
        }
        break;
      case 'gtann':
        if (window.gameManager && !window.gameManager.isInstalled('gtann')) {
          window.gameManager.showInSteam('gtann');
        } else if (window.appGtaNN) {
          window.appGtaNN.open();
        }
        break;
      case 'legion':
        if (window.gameManager && !window.gameManager.isInstalled('legion')) {
          window.gameManager.showInSteam('legion');
        } else if (window.appLegion) {
          window.appLegion.open();
        }
        break;
      case 'homm1_demo':
        if (window.gameManager && !window.gameManager.isInstalled('homm1_demo')) {
          window.gameManager.showOnCd('homm1_demo');
        } else if (window.appHomm1) {
          window.appHomm1.open();
        }
        break;
      case 'fallout':
        if (window.gameManager && !window.gameManager.isInstalled('fallout')) {
          window.gameManager.showInSteam('fallout');
        } else if (window.appFallout) {
          window.appFallout.open();
        }
        break;
      case 'falloutzp_demo':
        if (window.gameManager && !window.gameManager.isInstalled('falloutzp_demo')) {
          window.gameManager.showOnCd('falloutzp_demo');
        } else if (window.appFalloutZP) {
          window.appFalloutZP.open();
        }
        break;
      case 'anotherwar':
        if (window.gameManager && !window.gameManager.isInstalled('anotherwar')) {
          window.gameManager.showInSteam('anotherwar');
        } else if (window.appAnotherWar) {
          window.appAnotherWar.open();
        }
        break;
      case 'korovany_demo':
        if (window.gameManager && !window.gameManager.isInstalled('korovany_demo')) {
          window.gameManager.showOnCd('korovany_demo');
        } else if (window.appKorovany) {
          window.appKorovany.open();
        }
        break;
      case 'catniss':
        if (window.gameManager && !window.gameManager.isInstalled('catniss')) {
          window.gameManager.showInSteam('catniss');
        } else if (window.appCatniss) {
          window.appCatniss.open();
        }
        break;
      case 'plov':
        if (window.gameManager && !window.gameManager.isInstalled('plov')) {
          window.gameManager.showInSteam('plov');
        } else if (window.appPlov) {
          window.appPlov.open();
        }
        break;
      case 'sims3':
        if (window.gameManager && !window.gameManager.isInstalled('sims3')) {
          window.gameManager.showInSteam('sims3');
        } else if (window.appSims3) {
          window.appSims3.open();
        }
        break;
      case 'kotor98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('kotor98_demo')) {
          window.gameManager.showOnCd('kotor98_demo');
        } else if (window.appKotor98) {
          window.appKotor98.open();
        }
        break;
      case 'quake3':
        if (window.gameManager && !window.gameManager.isInstalled('quake3')) {
          window.gameManager.showInSteam('quake3');
        } else if (window.appQuake3) {
          window.appQuake3.open();
        }
        break;
      case 'hl2_demo':
        if (window.gameManager && !window.gameManager.isInstalled('hl2_demo')) {
          window.gameManager.showOnCd('hl2_demo');
        } else if (window.appHl2) {
          window.appHl2.open();
        }
        break;
      case 'gta90':
        if (window.gameManager && !window.gameManager.isInstalled('gta90')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: "Grand Theft Auto: Екатеринбург '90", icon: 'error', message: t('store.gameNotInstalled', "Grand Theft Auto: Екатеринбург '90") });
        } else if (window.appGta90) {
          window.appGta90.open();
        }
        break;
      case 'hsr98':
        if (window.gameManager && !window.gameManager.isInstalled('hsr98')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Honkai: Star Rail 98', icon: 'error', message: t('store.gameNotInstalled', 'Honkai: Star Rail 98') });
        } else if (window.appHsr98) {
          window.appHsr98.open();
        }
        break;
      case 'mc98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('mc98_demo')) {
          window.gameManager.showOnCd('mc98_demo');
        } else if (window.appMc98) {
          window.appMc98.open();
        }
        break;
      case 'moh98':
        if (window.gameManager && !window.gameManager.isInstalled('moh98')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Medal of Honor 98', icon: 'error', message: t('store.gameNotInstalled', 'Medal of Honor 98') });
        } else if (window.appMoh98) {
          window.appMoh98.open();
        }
        break;
      case 'stalker98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('stalker98_demo')) {
          window.gameManager.showOnCd('stalker98_demo');
        } else if (window.appStalker98) {
          window.appStalker98.open();
        }
        break;
      case 'serioussam':
        if (window.gameManager && !window.gameManager.isInstalled('serioussam')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Serious Sam 98', icon: 'error', message: t('store.gameNotInstalled', 'Serious Sam 98') });
        } else if (window.appSeriousSam) {
          window.appSeriousSam.open();
        }
        break;
      case 'diablo':
        if (window.gameManager && !window.gameManager.isInstalled('diablo')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({ title: 'Diablo', icon: 'error', message: t('store.gameNotInstalled', 'Diablo') });
        } else if (window.appDiablo) {
          window.appDiablo.open();
        }
        break;
      case 'half-life_demo':
        if (window.gameManager && !window.gameManager.isInstalled('half-life_demo')) {
          window.gameManager.showOnCd('half-life_demo');
        } else if (window.appHalfLife) {
          window.appHalfLife.open();
        }
        break;
      case 'neon-racer_demo':
        if (window.gameManager && !window.gameManager.isInstalled('neon-racer_demo')) {
          window.gameManager.showOnCd('neon-racer_demo');
        } else if (window.appNeonRacer) {
          window.appNeonRacer.open();
        }
        break;
      case 'steam':
        if (window.gameManager) window.gameManager.showInSteam();
        break;
      case 'blender':
        if (window.appBlender) window.appBlender.open();
        break;
      case 'blender204':
        if (window.appBlender204) window.appBlender204.open();
        break;
      case 'digicharat':
        if (window.appIE) window.appIE.open('http://www.digicharat.net');
        break;
      case 'notepad':
        if (window.appNotepad) window.appNotepad.open();
        break;
      case 'paint':
        if (window.appPaint) window.appPaint.open();
        break;
      case 'calc':
        if (window.appCalculator) window.appCalculator.open();
        break;
      case 'minesweeper':
        if (window.appMinesweeper) window.appMinesweeper.open();
        break;
      case 'wolf3d':
        if (window.gameManager && !window.gameManager.isInstalled('wolf3d')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'Wolfenstein 3D',
            icon: 'error',
            message: t('store.gameNotInstalled', 'Wolfenstein 3D')
          });
        } else if (window.appWolf3D) {
          window.appWolf3D.open();
        }
        break;
      case 'quest_demo':
        if (window.gameManager && !window.gameManager.isInstalled('quest_demo')) {
          window.gameManager.showOnCd('quest_demo');
        } else if (window.appScummQuest) {
          window.appScummQuest.open();
        }
        break;
      case 'stalker':
        if (window.gameManager && !window.gameManager.isInstalled('stalker')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'S.T.A.L.K.E.R.',
            icon: 'error',
            message: t('store.gameNotInstalled', 'S.T.A.L.K.E.R.')
          });
        } else if (window.appStalker) {
          window.appStalker.open();
        }
        break;
      case 'fallout98_demo':
        if (window.gameManager && !window.gameManager.isInstalled('fallout98_demo')) {
          window.gameManager.showOnCd('fallout98_demo');
        } else if (window.appFallout2) {
          window.appFallout2.open();
        }
        break;
      case 'burnout':
        if (window.appBurnout) {
          window.appBurnout.open();
        }
        break;
      case 'imaging':
        if (window.appImageViewer) window.appImageViewer.open();
        break;
      case 'videoplayer':
        if (window.gameManager && !window.gameManager.isInstalled('videoplayer')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'ActiveMovie Player',
            icon: 'error',
            message: t('store.appNotInstalled', 'ActiveMovie Player')
          });
        } else if (window.appVideoPlayer) {
          window.appVideoPlayer.open();
        }
        break;
      case 'photoshop':
        if (window.gameManager && !window.gameManager.isInstalled('photoshop')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'RetroShop 98',
            icon: 'error',
            message: t('store.appNotInstalled', 'RetroShop 98')
          });
        } else if (window.appPhotoshop) {
          window.appPhotoshop.open();
        }
        break;
      case 'wincommander':
        if (window.gameManager && !window.gameManager.isInstalled('wincommander')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'WinCommander 98',
            icon: 'error',
            message: t('store.appNotInstalled', 'WinCommander 98')
          });
        } else if (window.appWinCommander) {
          window.appWinCommander.open();
        }
        break;
      case 'winamp':
        if (window.gameManager && !window.gameManager.isInstalled('winamp')) {
          const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
          window.winManager.openDialog({
            title: 'WinAmp 98 Pro',
            icon: 'error',
            message: t('store.appNotInstalled', 'WinAmp 98 Pro')
          });
        } else if (window.appWinamp) {
          window.appWinamp.open();
        }
        break;
      case 'solitaire':
        if (window.appSolitaire) window.appSolitaire.open();
        break;
      case 'pinball':
        if (window.appPinball) window.appPinball.open();
        break;
      case 'sound-recorder':
        if (window.appSoundRecorder) window.appSoundRecorder.open();
        break;
      case 'defrag':
        if (window.appDefrag) window.appDefrag.open();
        break;
      case 'msbackup':
        if (window.appBackup) window.appBackup.open();
        break;
      case 'bugreport':
        if (window.appBugReport) window.appBugReport.open();
        break;
      case 'bugreport-list':
        if (window.appBugReport) window.appBugReport.openList();
        break;
      case 'icq':
        if (window.appICQ) window.appICQ.open();
        break;
      case 'outlook':
        if (window.appOutlook) window.appOutlook.open();
        break;
      case 'regedit':
        if (window.appRegEdit) window.appRegEdit.open();
        break;
      case 'taskmgr':
        if (window.appTaskManager) window.appTaskManager.open();
        break;
      case 'ie':
        if (window.appIE) window.appIE.open();
        break;
      case 'netscape':
        if (window.appNetscape) window.appNetscape.open();
        break;
      case 'my-docs':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents']);
        break;
      case 'my-pictures':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Мои рисунки']);
        break;
      case 'my-music':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Моя музыка']);
        break;
      case 'my-videos':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Мои видео']);
        break;
      case 'my-downloads':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Downloads']);
        break;
      case 'control-panel':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'Control Panel']);
        break;
      case 'regional-settings':
        if (window.appDialogs) window.appDialogs.openRegionalSettings();
        break;
      case 'properties':
        if (window.appDialogs) window.appDialogs.openDisplayProperties();
        break;
      case 'taskbar-props':
        if (window.appTaskbarProps) window.appTaskbarProps.open();
        break;
      case 'find':
        if (window.appFind) window.appFind.open();
        break;
      case 'sndvol':
        if (window.appSysTools) window.appSysTools.openVolumeControl();
        break;
      case 'cleanmgr':
        if (window.appSysTools) window.appSysTools.openCleanMgr();
        break;
      case 'scandisk':
        if (window.appSysTools) window.appSysTools.openScanDisk();
        break;
      case 'charmap':
        if (window.appSysTools) window.appSysTools.openCharMap();
        break;
      case 'msconfig':
        if (window.appSysTools) window.appSysTools.openMSConfig();
        break;
      case 'find-web':
        if (window.appIE) window.appIE.open('http://www.search98.com');
        break;
      case 'help':
        if (window.appDialogs) {
          if (window.appDialogs.openHelp) {
            window.appDialogs.openHelp();
          } else {
            window.appDialogs.openAboutWindows();
          }
        }
        break;
      case 'run':
        if (window.appDialogs) window.appDialogs.openRunDialog();
        break;
      case 'shutdown':
        if (window.appShutdown) window.appShutdown.openDialog();
        break;
      case 'bios-setup':
        if (window.biosEngine) window.biosEngine.openSetup();
        break;
      case 'qbasic':
        if (window.appQBasic) window.appQBasic.open();
        break;
      case 'mon-test':
        if (window.appMonTest) window.appMonTest.open();
        break;
      case 'cdex':
        if (window.appCDex) window.appCDex.open();
        break;
      case 'wintune':
        if (window.appWintune) window.appWintune.open('wintune');
        break;
      case 'clibench':
        if (window.appWintune) window.appWintune.open('clibench');
        break;
      case 'cdplayer':
        if (window.appCDPlayer) window.appCDPlayer.open();
        break;
      case 'sysmon':
        if (window.appSysMon) window.appSysMon.open();
        break;
      case 'hypertrm':
        if (window.appHyperTerminal) window.appHyperTerminal.open();
        break;
      case 'clipbrd':
        if (window.appClipboardViewer) window.appClipboardViewer.open();
        break;
      case 'mirc':
        if (window.appMIRC) window.appMIRC.open();
        break;
      case 'fasttracker':
        if (window.appFastTracker) window.appFastTracker.open();
        break;
      case 'acrobat':
        if (window.appAcrobat) window.appAcrobat.open();
        break;
      case 'acdsee':
        if (window.appACDSee) window.appACDSee.open();
        break;
      case 'emulator':
        if (window.appEmulator) window.appEmulator.open();
        break;
      case 'win-update':
        if (window.appIE) window.appIE.open('http://windowsupdate.microslop.com');
        break;
      case 'msinfo32':
        if (window.appSysTools && window.appSysTools.openMsInfo32) window.appSysTools.openMsInfo32();
        break;
      case 'sfc':
        if (window.appSysTools && window.appSysTools.openSfc) window.appSysTools.openSfc();
        break;
      case 'scanreg':
        if (window.appSysTools && window.appSysTools.openScanReg) window.appSysTools.openScanReg();
        break;
      case 'scheduled-tasks':
        if (window.appSysTools && window.appSysTools.openScheduledTasks) window.appSysTools.openScheduledTasks();
        break;
      case 'drvspace':
        if (window.appSysTools && window.appSysTools.openDriveSpace) window.appSysTools.openDriveSpace();
        break;
      case 'welcome':
        if (window.appDialogs && window.appDialogs.openWelcomeApp) window.appDialogs.openWelcomeApp();
        break;
      case 'hearts':
        if (window.appHearts && window.appHearts.open) window.appHearts.open();
        break;
      case 'explorer-tree':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:'], { showTree: true });
        break;
      case 'dos-prompt':
        if (window.appSysTools && window.appSysTools.openDosPromptWindow) window.appSysTools.openDosPromptWindow();
        break;
      case 'printers':
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'Printers']);
        break;
      case 'folder-options':
        if (window.appExplorer && window.appExplorer.openFolderOptions) window.appExplorer.openFolderOptions();
        break;
      case 'active-desktop':
        if (window.desktop && window.desktop.toggleChannelBar) window.desktop.toggleChannelBar();
        break;
      case 'logoff':
        if (window.winManager) {
          const isRu = window.i18n && window.i18n.getLanguage() === 'ru';
          window.winManager.openDialog({
            title: isRu ? 'Завершение сеанса Win' : 'Log Off Win',
            icon: 'users',
            message: isRu ? 'Вы действительно хотите завершить текущий сеанс?' : 'Are you sure you want to log off?',
            buttons: [
              {
                text: isRu ? 'Да' : 'Yes',
                primary: true,
                isDefault: true,
                onClick: () => {
                  window.winManager.windows.forEach(w => {
                    if (!w.element.classList.contains('is-dialog')) window.winManager.closeWindow(w.id);
                  });
                  if (window.soundSys && window.soundSys.playStartup) window.soundSys.playStartup();
                }
              },
              { text: isRu ? 'Нет' : 'No', onClick: () => {} }
            ]
          });
        }
        break;
    }
  }

  initTray() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    this.icqTrayEl = document.createElement('div');
    this.icqTrayEl.id = 'tray-icq-icon';
    this.icqTrayEl.className = 'tray-icon';
    this.icqTrayEl.title = 'ICQ 98a (Online)';
    this.icqTrayEl.innerHTML = Icons['icq-online'];
    this.icqTrayEl.addEventListener('click', () => {
      if (window.appICQ) window.appICQ.open();
    });
    this.trayEl.insertBefore(this.icqTrayEl, this.clockEl);

    this.speakerEl = document.createElement('div');
    this.speakerEl.className = 'tray-icon';
    this.speakerEl.id = 'tray-speaker-icon';
    this.updateSpeakerState();

    let speakerClickTimer = null;
    this.speakerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (speakerClickTimer) {
        clearTimeout(speakerClickTimer);
        speakerClickTimer = null;
      }
      speakerClickTimer = setTimeout(() => {
        this.toggleVolumePopup();
        speakerClickTimer = null;
      }, 220);
    });

    this.speakerEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (speakerClickTimer) {
        clearTimeout(speakerClickTimer);
        speakerClickTimer = null;
      }
      this.closeVolumePopup();
      if (window.appSysTools) window.appSysTools.openVolumeControl();
    });

    this.speakerEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isMuted = window.soundSys ? window.soundSys.muted : false;
      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          {
            label: t('tray.openVolume'),
            bold: true,
            action: () => {
              if (window.appSysTools) window.appSysTools.openVolumeControl();
            }
          },
          {
            label: t('tray.audioProps'),
            action: () => {
              if (window.appCPanel) window.appCPanel.openMultimediaProperties();
            }
          },
          { separator: true },
          {
            label: (isMuted ? '✓ ' : '   ') + t('tray.mute'),
            action: () => {
              if (window.soundSys) window.soundSys.toggleMute();
            }
          }
        ]);
      }
    });

    this.crtEl = document.createElement('div');
    this.crtEl.className = 'tray-icon';
    this.crtEl.title = t('taskbar.crt');
    this.crtEl.innerHTML = Icons['monitor'];
    this.crtEl.addEventListener('click', () => {
      if (window.appDialogs && typeof window.appDialogs.toggleCrt === 'function') {
        window.appDialogs.toggleCrt();
      } else {
        const crt = document.getElementById('crt-overlay');
        if (crt) {
          crt.classList.toggle('active');
          document.body.classList.toggle('crt-enabled');
        }
      }
    });

    this.langBadge = document.createElement('button');
    this.langBadge.className = 'tray-lang-badge';
    this.updateTrayTooltips();

    this.langBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.i18n) {
        const next = window.i18n.getLanguage() === 'ru' ? 'en' : 'ru';
        window.i18n.setLanguage(next);
      }
    });

    this.langBadge.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = window.i18n ? window.i18n.getLanguage() : 'ru';
      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          {
            label: (current === 'ru' ? '✓ ' : '   ') + t('regional.langRu'),
            action: () => window.i18n && window.i18n.setLanguage('ru')
          },
          {
            label: (current === 'en' ? '✓ ' : '   ') + t('regional.langEn'),
            action: () => window.i18n && window.i18n.setLanguage('en')
          },
          { separator: true },
          {
            label: current === 'ru' ? 'Свойства...' : 'Properties...',
            action: () => window.appCPanel && window.appCPanel.openKeyboardProperties ? window.appCPanel.openKeyboardProperties() : (window.appDialogs && window.appDialogs.openRegionalSettings())
          },
          {
            label: t('regional.title') + '...',
            action: () => window.appDialogs && window.appDialogs.openRegionalSettings()
          }
        ]);
      }
    });

    this.trayEl.insertBefore(this.langBadge, this.clockEl);
    this.trayEl.insertBefore(this.speakerEl, this.clockEl);
    this.trayEl.insertBefore(this.crtEl, this.clockEl);

    this.cdRomEl = document.createElement('div');
    this.cdRomEl.className = 'tray-icon';
    this.cdRomEl.id = 'tray-cdrom-icon';
    this.updateCdRomTray();

    const showCdRomMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isInserted = window.vfs && window.vfs.isCdRomInserted();
      const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
      if (window.contextMenu) {
        const items = [];
        if (isInserted) {
          if (discId === 'office_games_98') {
            items.push({
              label: t('cdrom.runOffice'),
              bold: true,
              action: () => {
                if (window.appOfficeLauncher) window.appOfficeLauncher.open();
              }
            });
          } else {
            items.push({
              label: t('cdrom.run'),
              bold: true,
              action: () => {
                if (window.appIgroman) window.appIgroman.open();
              }
            });
          }
          items.push({
            label: t('cdrom.openExplorer'),
            action: () => {
              if (window.appExplorer) window.appExplorer.open(['My Computer', 'D:']);
            }
          });
          items.push({ separator: true });
          if (discId === 'office_games_98') {
            items.push({
              label: t('cdrom.insertIgromania'),
              action: () => {
                if (window.vfs) window.vfs.insertCdRom('D:', 'igromania_09_1998');
              }
            });
          } else {
            items.push({
              label: t('cdrom.insertOffice'),
              action: () => {
                if (window.vfs) window.vfs.insertCdRom('D:', 'office_games_98');
              }
            });
          }
          items.push({ separator: true });
          items.push({
            label: t('cdrom.eject'),
            action: () => {
              if (window.vfs) window.vfs.ejectCdRom();
            }
          });
        } else {
          items.push({
            label: t('cdrom.insertOffice'),
            bold: true,
            action: () => {
              if (window.vfs) window.vfs.insertCdRom('D:', 'office_games_98');
            }
          });
          items.push({
            label: t('cdrom.insertIgromania'),
            action: () => {
              if (window.vfs) window.vfs.insertCdRom('D:', 'igromania_09_1998');
            }
          });
        }
        window.contextMenu.show(e.clientX, e.clientY, items);
      }
    };

    this.cdRomEl.addEventListener('click', (e) => {
      const isInserted = window.vfs && window.vfs.isCdRomInserted();
      const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
      if (isInserted) {
        if (discId === 'office_games_98' && window.appOfficeLauncher) {
          window.appOfficeLauncher.open();
        } else if (window.appIgroman) {
          window.appIgroman.open();
        } else {
          showCdRomMenu(e);
        }
      } else {
        showCdRomMenu(e);
      }
    });
    this.cdRomEl.addEventListener('contextmenu', showCdRomMenu);

    this.trayEl.insertBefore(this.cdRomEl, this.clockEl);

    this.clippyTrayEl = document.createElement('div');
    this.clippyTrayEl.className = 'tray-icon';
    this.clippyTrayEl.id = 'tray-clippy-icon';
    this.clippyTrayEl.innerHTML = Icons['clippy'] || '';
    this.clippyTrayEl.title = t('tray.clippy');
    this.clippyTrayEl.style.width = '16px';
    this.clippyTrayEl.style.height = '16px';
    this.clippyTrayEl.style.display = 'flex';
    this.clippyTrayEl.style.alignItems = 'center';
    this.clippyTrayEl.style.justifyContent = 'center';
    this.clippyTrayEl.style.cursor = 'pointer';

    this.clippyTrayEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundSys) window.soundSys.playClick();
      if (window.appClippy) {
        window.appClippy.toggleVisible();
      }
    });

    this.clippyTrayEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (window.appClippy) {
        window.appClippy.show();
        window.appClippy.poke();
      }
    });

    this.clippyTrayEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.appClippy) {
        window.appClippy.openContextMenu(e.clientX, e.clientY);
      }
    });

    this.trayEl.insertBefore(this.clippyTrayEl, this.clockEl);
    this.updatePowerTray();
  }

  updatePowerTray() {
    if (window.appCPanel && typeof window.appCPanel.syncPowerTrayIcon === 'function') {
      window.appCPanel.syncPowerTrayIcon();
    }
  }

  updateCdRomTray() {
    if (!this.cdRomEl) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isInserted = window.vfs && window.vfs.isCdRomInserted();
    const discId = window.vfs && window.vfs.cdRomState && window.vfs.cdRomState.discId;
    this.cdRomEl.innerHTML = isInserted ? (Icons['drive-cd'] || Icons['drive-d']) : (Icons['drive-cd-empty'] || Icons['drive-d']);
    this.cdRomEl.title = isInserted
      ? (discId === 'office_games_98' ? t('cdrom.insertedOffice') : t('cdrom.inserted'))
      : t('cdrom.ejected');
    this.cdRomEl.style.width = '16px';
    this.cdRomEl.style.height = '16px';
    this.cdRomEl.style.display = 'flex';
    this.cdRomEl.style.alignItems = 'center';
    this.cdRomEl.style.justifyContent = 'center';
    this.cdRomEl.style.cursor = 'pointer';
  }

  toggleVolumePopup() {
    if (this.volumePopupEl) {
      this.closeVolumePopup();
    } else {
      this.openVolumePopup();
    }
  }

  openVolumePopup() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const sys = window.soundSys;
    const level = sys ? Math.round(sys.getMasterVolume() * 100) : 80;
    const muted = sys ? sys.muted : false;

    const popup = document.createElement('div');
    popup.id = 'tray-volume-popup';
    popup.innerHTML = `
      <div class="tray-volume-title">${t('tray.volume')}</div>
      <input type="range" min="0" max="100" value="${level}" class="tray-volume-slider sndvol-master-slider">
      <label class="tray-volume-mute"><input type="checkbox" class="sndvol-master-mute"${muted ? ' checked' : ''}> ${t('sndvol.mute')}</label>
    `;
    document.body.appendChild(popup);

    const iconRect = this.speakerEl.getBoundingClientRect();
    const taskbarRect = this.trayEl.getBoundingClientRect();
    const left = Math.min(window.innerWidth - popup.offsetWidth - 2, iconRect.left + iconRect.width / 2 - popup.offsetWidth / 2);
    popup.style.left = `${Math.max(2, left)}px`;
    popup.style.bottom = `${window.innerHeight - taskbarRect.top + 2}px`;

    const slider = popup.querySelector('.tray-volume-slider');
    slider.addEventListener('input', () => {
      if (window.soundSys) window.soundSys.setMasterVolume(parseInt(slider.value, 10) / 100);
    });
    slider.addEventListener('change', () => {
      if (window.soundSys && !window.soundSys.muted) window.soundSys.playDing();
    });

    const muteBox = popup.querySelector('.sndvol-master-mute');
    muteBox.addEventListener('change', () => {
      if (window.soundSys) window.soundSys.setMuted(muteBox.checked);
    });

    this.volumePopupDismiss = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      if (e.type === 'mousedown' && (popup.contains(e.target) || this.speakerEl.contains(e.target))) return;
      this.closeVolumePopup();
    };
    document.addEventListener('mousedown', this.volumePopupDismiss, true);
    document.addEventListener('keydown', this.volumePopupDismiss, true);
    window.addEventListener('blur', this.volumePopupDismiss);

    this.volumePopupEl = popup;
    slider.focus();
  }

  closeVolumePopup() {
    if (!this.volumePopupEl) return;
    document.removeEventListener('mousedown', this.volumePopupDismiss, true);
    document.removeEventListener('keydown', this.volumePopupDismiss, true);
    window.removeEventListener('blur', this.volumePopupDismiss);
    this.volumePopupEl.remove();
    this.volumePopupEl = null;
    this.volumePopupDismiss = null;
  }

  updateSpeakerState() {
    if (!this.speakerEl) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isMuted = window.soundSys ? window.soundSys.muted : false;
    this.speakerEl.innerHTML = (isMuted && Icons['speaker-muted']) ? Icons['speaker-muted'] : Icons['speaker'];
    this.speakerEl.title = isMuted 
      ? t('tray.volumeMuted')
      : t('tray.volume');
  }

  updateTrayTooltips() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const current = window.i18n ? window.i18n.getLanguage() : 'ru';
    if (this.langBadge) {
      this.langBadge.textContent = current.charAt(0).toUpperCase() + current.slice(1);
      this.langBadge.title = t('taskbar.lang');
    }
    this.updateSpeakerState();
    this.updateCdRomTray();
    this.updatePowerTray();
    if (this.crtEl) this.crtEl.title = t('taskbar.crt');
    if (this.clippyTrayEl) this.clippyTrayEl.title = t('tray.clippy');
  }

  initTaskbarContextMenu() {
    if (!this.taskbarEl) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    this.taskbarEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.taskbar-item') || e.target.closest('#start-button')) return;

      e.preventDefault();
      e.stopPropagation();

      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          { label: t('taskbar.toolbars'), disabled: true },
          { separator: true },
          {
            label: t('taskbar.cascade'),
            action: () => window.winManager && window.winManager.cascadeWindows()
          },
          {
            label: t('taskbar.tileH'),
            action: () => window.winManager && window.winManager.tileWindows(false)
          },
          {
            label: t('taskbar.tileV'),
            action: () => window.winManager && window.winManager.tileWindows(true)
          },
          {
            label: t('taskbar.minimizeAll'),
            action: () => window.winManager && window.winManager.minimizeAll()
          },
          { separator: true },
          {
            label: t('taskbar.taskManager'),
            action: () => {
              if (window.appTaskManager) window.appTaskManager.open();
            }
          },
          {
            label: t('taskbar.properties'),
            bold: true,
            action: () => window.appTaskbarProps && window.appTaskbarProps.open()
          }
        ]);
      }
    });
  }

  defaultSettings() {
    return { alwaysOnTop: true, autoHide: false, smallIcons: false, showClock: true };
  }

  loadSettings() {
    const settings = this.defaultSettings();
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('win98_taskbar_settings') || 'null');
    } catch (e) {
      saved = null;
    }
    if (!saved || typeof saved !== 'object') return settings;
    Object.keys(settings).forEach(key => {
      if (typeof saved[key] === 'boolean') settings[key] = saved[key];
    });
    return settings;
  }

  saveSettings(next) {
    const previous = { ...this.settings };
    this.settings = { ...this.defaultSettings(), ...next };
    try {
      localStorage.setItem('win98_taskbar_settings', JSON.stringify(this.settings));
    } catch (e) {}
    this.applySettings();
    return previous;
  }

  applySettings() {
    const settings = this.settings;
    document.body.classList.toggle('taskbar-autohide', settings.autoHide);
    document.body.classList.toggle('taskbar-below-windows', !settings.alwaysOnTop);
    document.body.classList.toggle('taskbar-no-clock', !settings.showClock);
    this.startMenu.classList.toggle('small-icons', settings.smallIcons);
    if (settings.autoHide) {
      this.scheduleAutoHide(300);
    } else {
      clearTimeout(this.autoHideTimer);
      this.taskbarEl.classList.remove('is-revealed');
    }
    if (settings.alwaysOnTop) this.raiseTaskbar(false);
    if (window.desktop && typeof window.desktop.applyPositions === 'function') window.desktop.applyPositions();
  }

  initAutoHide() {
    this.taskbarEl.addEventListener('mouseenter', () => {
      this.pointerOnTaskbar = true;
      this.revealTaskbar();
    });
    this.taskbarEl.addEventListener('mouseleave', () => {
      this.pointerOnTaskbar = false;
      this.scheduleAutoHide();
    });
  }

  revealTaskbar() {
    clearTimeout(this.autoHideTimer);
    if (this.settings.autoHide) this.taskbarEl.classList.add('is-revealed');
  }

  scheduleAutoHide(delay = 500) {
    clearTimeout(this.autoHideTimer);
    if (!this.settings.autoHide) return;
    this.autoHideTimer = setTimeout(() => {
      if (this.taskbarBusy()) {
        this.scheduleAutoHide(delay);
        return;
      }
      this.taskbarEl.classList.remove('is-revealed');
    }, delay);
  }

  taskbarBusy() {
    const menu = window.contextMenu && window.contextMenu.el;
    return Boolean(this.pointerOnTaskbar)
      || this.startMenu.classList.contains('open')
      || Boolean(this.volumePopupEl)
      || Boolean(menu && menu.style.display === 'block')
      || Date.now() < (this.peekUntil || 0);
  }

  isTaskbarHidden() {
    return this.settings.autoHide && !this.taskbarEl.classList.contains('is-revealed');
  }

  peekTaskbar(ms = 1200) {
    if (!this.settings.autoHide) return false;
    this.taskbarEl.classList.add('no-slide');
    this.revealTaskbar();
    this.taskbarEl.getBoundingClientRect();
    this.taskbarEl.classList.remove('no-slide');
    this.peekUntil = Date.now() + ms;
    this.scheduleAutoHide(ms);
    return true;
  }

  initLayering() {
    document.addEventListener('mousedown', (e) => {
      if (this.settings.alwaysOnTop) return;
      const menu = window.contextMenu && window.contextMenu.el;
      const onTaskbar = this.taskbarEl.contains(e.target)
        || this.startMenu.contains(e.target)
        || Boolean(menu && menu.contains(e.target))
        || Boolean(this.volumePopupEl && this.volumePopupEl.contains(e.target));
      this.raiseTaskbar(onTaskbar);
    }, true);
  }

  raiseTaskbar(raised) {
    this.taskbarEl.classList.toggle('is-raised', Boolean(raised));
  }

  escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  startMenuFolderPath() {
    return ['My Computer', 'C:', 'WINDOWS', 'Start Menu'];
  }

  ensureStartMenuFolder() {
    const windowsDir = window.vfs && window.vfs.resolvePath(['My Computer', 'C:', 'WINDOWS']);
    if (!windowsDir || !windowsDir.children) return null;
    if (!windowsDir.children['Start Menu']) {
      windowsDir.children['Start Menu'] = { type: 'folder', name: 'Start Menu', icon: 'folder', children: {} };
      this.startMenuFolderDirty = true;
    }
    return windowsDir.children['Start Menu'];
  }

  loadStartMenuState() {
    try {
      const saved = JSON.parse(localStorage.getItem('win98_start_menu') || 'null');
      if (saved && Array.isArray(saved.hidden) && Array.isArray(saved.mirrored)) return saved;
    } catch (e) {}
    return { hidden: [], mirrored: [] };
  }

  saveStartMenuState(state) {
    try {
      localStorage.setItem('win98_start_menu', JSON.stringify(state));
    } catch (e) {}
  }

  iconKeyOf(iconEl) {
    if (!iconEl) return 'programs';
    if (!this.iconKeysByMarkup) {
      const probe = document.createElement('div');
      this.iconKeysByMarkup = new Map();
      Object.keys(Icons).forEach(key => {
        if (typeof Icons[key] !== 'string') return;
        probe.innerHTML = Icons[key];
        if (!this.iconKeysByMarkup.has(probe.innerHTML)) this.iconKeysByMarkup.set(probe.innerHTML, key);
      });
    }
    return this.iconKeysByMarkup.get(iconEl.innerHTML) || 'programs';
  }

  builtinStartMenuEntries() {
    const entries = [];
    const walk = (item, parent) => {
      const folder = Boolean(item.dataset.menu);
      const key = folder ? `menu:${item.dataset.menu}` : `action:${item.dataset.action}`;
      const textEl = item.querySelector(':scope > .start-menu-item-text');
      entries.push({ key, parent, folder, el: item, label: textEl ? textEl.textContent.trim() : key });
      const sub = item.querySelector(':scope > .start-submenu');
      if (!sub) return;
      [...sub.children]
        .filter(child => child.matches('.start-menu-item[data-menu], .start-menu-item[data-action]'))
        .forEach(child => walk(child, key));
    };
    const programs = this.startMenu.querySelector('.start-menu-items > .start-menu-item[data-menu="programs"]');
    if (programs) walk(programs, 'root');
    return entries;
  }

  readStartMenuFolder(root) {
    const present = new Map();
    const custom = [];
    const walk = (folder, parentRef, path) => {
      Object.keys(folder.children || {}).forEach(key => {
        const node = folder.children[key];
        if (!node || typeof node !== 'object') return;
        const ref = typeof node.content === 'string' ? node.content : '';
        const nodePath = path.concat(key);
        if (node.type === 'folder' || node.children) {
          if (!node.children) {
            node.children = {};
            this.startMenuFolderDirty = true;
          }
          const builtin = ref.startsWith('menu:') && !present.has(ref);
          const folderRef = builtin ? ref : `folder:${nodePath.join('\\')}`;
          if (builtin) present.set(ref, { node, folder, key });
          else custom.push({ kind: 'folder', ref: folderRef, parentRef, node, key, path: nodePath });
          walk(node, folderRef, nodePath);
        } else if (node.app === 'shortcut') {
          if (ref.startsWith('action:') && !present.has(ref)) present.set(ref, { node, folder, key });
          else custom.push({ kind: 'link', parentRef, node, key, path: nodePath });
        }
      });
    };
    walk(root, 'root', []);
    return { present, custom };
  }

  uniqueChildKey(folder, label) {
    const base = String(label || '').replace(/[\\/:*?"<>|]/g, '').trim() || 'Shortcut';
    let key = base;
    for (let i = 2; folder.children[key]; i++) key = `${base} (${i})`;
    return key;
  }

  applyStartMenuFolder() {
    this.startMenuLinks = [];
    const root = this.ensureStartMenuFolder();
    if (!root) return;
    const state = this.loadStartMenuState();
    const entries = this.builtinStartMenuEntries();
    const byKey = new Map(entries.map(entry => [entry.key, entry]));
    const { present, custom } = this.readStartMenuFolder(root);

    const hidden = new Set(state.hidden.filter(key => !present.has(key)));
    state.mirrored.forEach(key => {
      const entry = byKey.get(key);
      const parentGone = entry && entry.parent !== 'root' && !present.has(entry.parent);
      if (!present.has(key) && !parentGone) hidden.add(key);
    });

    const isShown = (entry) => {
      for (let e = entry; e; e = byKey.get(e.parent)) {
        if (hidden.has(e.key)) return false;
      }
      return true;
    };
    const visible = entries.filter(isShown);

    visible.forEach(entry => {
      if (present.has(entry.key)) return;
      const parentInfo = present.get(entry.parent);
      const parentFolder = entry.parent === 'root' ? root : (parentInfo && parentInfo.node);
      if (!parentFolder || !parentFolder.children) return;
      const key = this.uniqueChildKey(parentFolder, entry.label);
      parentFolder.children[key] = entry.folder
        ? { type: 'folder', name: key, icon: 'programs', content: entry.key, children: {} }
        : { type: 'file', name: key, icon: this.iconKeyOf(entry.el.querySelector(':scope > .start-menu-item-icon')), app: 'shortcut', content: entry.key };
      present.set(entry.key, { node: parentFolder.children[key], folder: parentFolder, key });
      this.startMenuFolderDirty = true;
    });

    [...present.keys()].forEach(key => {
      if (byKey.has(key)) return;
      const info = present.get(key);
      delete info.folder.children[info.key];
      present.delete(key);
      this.startMenuFolderDirty = true;
    });

    state.hidden = [...hidden];
    state.mirrored = visible.map(entry => entry.key);
    this.saveStartMenuState(state);
    if (this.startMenuFolderDirty && window.vfs) {
      this.startMenuFolderDirty = false;
      window.vfs.saveToStorage();
    }

    entries.forEach(entry => {
      if (!isShown(entry)) entry.el.remove();
    });
    this.insertCustomStartMenuItems(custom, visible);
  }

  insertCustomStartMenuItems(custom, visible) {
    const lists = new Map();
    visible.forEach(entry => {
      if (entry.folder) lists.set(entry.key, entry.el.querySelector(':scope > .start-submenu'));
    });
    const top = this.startMenu.querySelector('.start-menu-items');
    const programs = top.querySelector(':scope > .start-menu-item[data-menu="programs"]') || top.firstElementChild;
    let topCount = 0;
    custom.slice().sort((a, b) => a.path.length - b.path.length).forEach(item => {
      const el = this.buildCustomMenuItem(item);
      if (item.parentRef === 'root') {
        top.insertBefore(el, programs);
        topCount++;
      } else {
        const list = lists.get(item.parentRef);
        if (!list) return;
        const firstLink = item.kind === 'folder'
          ? [...list.children].find(child => child.classList.contains('start-menu-item') && !child.dataset.menu)
          : null;
        list.insertBefore(el, firstLink || null);
      }
      if (item.kind === 'folder') lists.set(item.ref, el.querySelector(':scope > .start-submenu'));
    });
    if (topCount) {
      const separator = document.createElement('div');
      separator.className = 'start-menu-separator';
      top.insertBefore(separator, programs);
    }
    this.startMenu.querySelectorAll('.start-submenu').forEach(list => this.tidyMenuList(list));
  }

  buildCustomMenuItem(item) {
    const el = document.createElement('div');
    el.className = 'start-menu-item';
    const name = this.escapeHtml(item.node.name || item.key);
    if (item.kind === 'folder') {
      this.customFolderCount = (this.customFolderCount || 0) + 1;
      el.dataset.menu = `custom-${this.customFolderCount}`;
      el.innerHTML = `
        <div class="start-menu-item-icon">${Icons['programs']}</div>
        <div class="start-menu-item-text">${name}</div>
        <div class="start-menu-item-arrow"></div>
        <div class="start-submenu"></div>`;
      return el;
    }
    el.dataset.link = String(this.startMenuLinks.push({ ref: item.node.content, name: item.node.name || item.key }) - 1);
    el.innerHTML = `
      <div class="start-menu-item-icon">${Icons[item.node.icon] || Icons['programs']}</div>
      <div class="start-menu-item-text">${name}</div>`;
    return el;
  }

  tidyMenuList(list) {
    const isSeparator = (el) => el && el.classList.contains('start-menu-separator');
    [...list.children].forEach((child, i, all) => {
      if (isSeparator(child) && (i === 0 || isSeparator(all[i - 1]))) child.remove();
    });
    while (isSeparator(list.lastElementChild)) list.lastElementChild.remove();
    if (!list.querySelector(':scope > .start-menu-item')) {
      const empty = document.createElement('div');
      empty.className = 'start-menu-item is-empty';
      empty.innerHTML = `<div class="start-menu-item-icon"></div><div class="start-menu-item-text">${this.escapeHtml(window.i18n ? window.i18n.t('startmenu.empty') : '(Empty)')}</div>`;
      list.appendChild(empty);
    }
  }

  shortcutIconFor(command) {
    const target = this.resolveVfsCommand(command);
    if (target) {
      const folder = window.vfs.resolvePath(target.path);
      const node = folder && folder.children ? folder.children[target.key] : null;
      if (node && node.icon && Icons[node.icon]) return node.icon;
      return node && node.children ? 'folder' : 'file-exe';
    }
    const text = String(command || '').trim().toLowerCase();
    if (/^(https?:\/\/|www\.)/.test(text)) return 'internet-explorer';
    const name = text.split(/\s+/)[0].replace(/\.exe$/, '');
    const aliases = {
      calc: 'calculator', mspaint: 'paint', pbrush: 'paint', winmine: 'minesweeper', sol: 'solitaire',
      iexplore: 'internet-explorer', control: 'control-panel', sndrec32: 'sound-recorder', sndvol32: 'volume-mixer',
      explorer: 'my-computer', clippy: 'clippy'
    };
    const key = aliases[name] || name;
    return Icons[key] ? key : 'file-exe';
  }

  addStartMenuShortcut(folderPath, name, command) {
    const folder = window.vfs && window.vfs.resolvePath(folderPath);
    if (!folder || !folder.children) return null;
    const key = this.uniqueChildKey(folder, name);
    folder.children[key] = { type: 'file', name: key, icon: this.shortcutIconFor(command), app: 'shortcut', content: `run:${command}` };
    window.vfs.saveToStorage();
    this.renderStartMenuContent();
    return key;
  }

  createStartMenuFolder(parentPath, name) {
    const folder = window.vfs && window.vfs.resolvePath(parentPath);
    if (!folder || !folder.children) return null;
    const key = this.uniqueChildKey(folder, name);
    folder.children[key] = { type: 'folder', name: key, icon: 'programs', content: '', children: {} };
    window.vfs.saveToStorage();
    this.renderStartMenuContent();
    return key;
  }

  removeStartMenuItem(folderPath, key) {
    const removed = window.vfs && window.vfs.deleteItem(folderPath, key, true);
    this.renderStartMenuContent();
    return Boolean(removed);
  }

  openStartMenuLink(link) {
    if (!link) return;
    if (link.doc) {
      this.openVfsItem(link.doc.path, link.doc.key, link.doc.name);
      return;
    }
    const ref = typeof link.ref === 'string' ? link.ref : '';
    if (ref.startsWith('action:')) {
      this.handleStartAction(ref.slice('action:'.length));
      return;
    }
    if (window.soundSys) window.soundSys.playClick();
    if (ref.startsWith('run:')) this.runCommandLine(ref.slice('run:'.length), link.name);
  }

  runCommandLine(command, name) {
    const target = this.resolveVfsCommand(command);
    if (target) {
      this.openVfsItem(target.path, target.key, name);
      return;
    }
    if (/^[a-z]:\\/i.test(String(command).trim())) {
      this.showMissingShortcut(name || command);
      return;
    }
    if (window.appDialogs) window.appDialogs.executeRunCommand(command);
  }

  resolveVfsCommand(command) {
    const parts = String(command || '').trim().replace(/^"|"$/g, '').split('\\').filter(Boolean);
    if (parts.length < 2 || !/^[a-z]:$/i.test(parts[0]) || !window.vfs) return null;
    let folder = window.vfs.resolvePath(['My Computer']);
    const path = ['My Computer'];
    for (let i = 0; i < parts.length; i++) {
      const children = folder && folder.children;
      if (!children) return null;
      const want = parts[i].toLowerCase();
      const key = Object.keys(children).find(k => k.toLowerCase() === want || String(children[k].name || '').toLowerCase() === want);
      if (!key) return null;
      if (i === parts.length - 1) return { path, key };
      path.push(key);
      folder = children[key];
    }
    return null;
  }

  vfsCommandFor(path, key) {
    return path.filter(part => part !== 'My Computer').concat(key).join('\\');
  }

  openVfsItem(path, key, name) {
    const folder = window.vfs && window.vfs.resolvePath(path);
    const node = folder && folder.children ? folder.children[key] : null;
    if (!node) {
      this.showMissingShortcut(name || key);
      return;
    }
    const explorer = window.appExplorer;
    if (!explorer) return;
    if (node.children || node.type === 'folder' || node.type === 'drive') {
      explorer.open(path.concat(key));
      return;
    }
    const previous = explorer.currentPath;
    explorer.currentPath = path.slice();
    try {
      explorer.openItem(null, { ...node, key });
    } finally {
      explorer.currentPath = previous;
    }
  }

  showMissingShortcut(name) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (window.soundSys) window.soundSys.playError();
    window.winManager.openDialog({
      title: t('startmenu.missingTitle'),
      icon: 'warning',
      message: t('startmenu.missingText', this.escapeHtml(name))
    });
  }

  loadRecentDocuments() {
    try {
      const list = JSON.parse(localStorage.getItem('win98_recent_docs') || '[]');
      return Array.isArray(list) ? list.filter(doc => doc && Array.isArray(doc.path) && doc.key) : [];
    } catch (e) {
      return [];
    }
  }

  addRecentDocument(path, item) {
    const key = item && (item.key || item.name);
    if (!key || !Array.isArray(path)) return;
    const where = path.join('\\');
    const list = this.loadRecentDocuments().filter(doc => !(doc.key === key && doc.path.join('\\') === where));
    list.unshift({ path: path.slice(), key, name: item.name || key, icon: item.icon || 'file-txt' });
    try {
      localStorage.setItem('win98_recent_docs', JSON.stringify(list.slice(0, 15)));
    } catch (e) {}
  }

  appendRecentDocuments() {
    const docs = this.loadRecentDocuments();
    const list = this.startMenu.querySelector('.start-menu-item[data-menu="documents"] > .start-submenu');
    if (!list || !docs.length) return;
    const separator = document.createElement('div');
    separator.className = 'start-menu-separator';
    list.appendChild(separator);
    docs.forEach(doc => {
      const el = document.createElement('div');
      el.className = 'start-menu-item';
      el.dataset.link = String(this.startMenuLinks.push({ doc }) - 1);
      el.innerHTML = `
        <div class="start-menu-item-icon">${Icons[doc.icon] || Icons['file-txt']}</div>
        <div class="start-menu-item-text">${this.escapeHtml(doc.name)}</div>`;
      list.appendChild(el);
    });
  }

  hasPersonalHistory() {
    const count = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return key === 'win98_run_mru' ? 1 : 0;
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.length : 0;
      } catch (e) {
        return 0;
      }
    };
    return this.loadRecentDocuments().length + count('win98_run_mru') + count('win98_netscape_history') > 0;
  }

  clearPersonalHistory() {
    const had = this.hasPersonalHistory();
    try {
      localStorage.setItem('win98_recent_docs', '[]');
      localStorage.setItem('win98_run_mru', '[]');
      localStorage.setItem('win98_netscape_history', '[]');
    } catch (e) {}
    this.renderStartMenuContent();
    return had;
  }

  addWindow(win) {
    const btn = document.createElement('button');
    btn.className = 'taskbar-item';
    btn.id = 'taskbar-btn-' + win.id;
    btn.title = win.title;
    btn.innerHTML = `
      <div class="taskbar-item-icon">${Icons[win.icon] || Icons['notepad']}</div>
      <div class="taskbar-item-title">${win.title}</div>
    `;

    btn.addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      if (win.isMinimized) {
        window.winManager.restoreWindow(win.id);
      } else if (window.winManager.activeWindowId === win.id) {
        window.winManager.minimizeWindow(win.id);
      } else {
        window.winManager.bringToTop(win.id);
      }
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

      if (window.contextMenu) {
        window.contextMenu.show(e.clientX, e.clientY, [
          {
            label: t('win.restore'),
            disabled: !win.isMinimized && !win.isMaximized,
            action: () => {
              if (win.isMinimized) window.winManager.restoreWindow(win.id);
              else if (win.isMaximized) window.winManager.toggleMaximize(win.id);
            }
          },
          {
            label: t('win.move'),
            disabled: win.isMaximized,
            action: () => {}
          },
          {
            label: t('win.size'),
            disabled: !win.resizable || win.isMaximized,
            action: () => {}
          },
          {
            label: t('win.minimize'),
            disabled: win.isMinimized,
            action: () => window.winManager.minimizeWindow(win.id)
          },
          {
            label: t('win.maximize'),
            disabled: !win.resizable || win.isMaximized,
            action: () => window.winManager.toggleMaximize(win.id)
          },
          { separator: true },
          {
            label: t('win.close'),
            bold: true,
            shortcut: 'Alt+F4',
            action: () => window.winManager.closeWindow(win.id)
          }
        ]);
      }
    });

    this.taskbarWindows.appendChild(btn);
    this.windowButtons.set(win.id, btn);
    this.updateActiveState(win.id);
  }

  removeWindow(id) {
    const btn = this.windowButtons.get(id);
    if (btn) {
      btn.remove();
      this.windowButtons.delete(id);
    }
  }

  updateActiveState(activeId) {
    this.windowButtons.forEach((btn, id) => {
      if (id === activeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

window.taskbar = new Taskbar();

