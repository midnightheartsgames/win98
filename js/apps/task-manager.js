class AppTaskManager {
  constructor() {
    this.winId = 'app_taskmgr';
    this.win = null;
    this.activeTab = 'applications';

    this.selectedAppId = null;
    this.selectedProcPid = null;
    this.selectedServiceId = null;

    this.showAllUsers = true;
    this.sortColumn = 'imageName';
    this.sortAsc = true;
    this.updateSpeed = 1000;
    this.alwaysOnTop = false;
    this.minimizeOnUse = false;
    this.hideWhenMinimized = false;
    this.showKernelTimes = true;

    this.systemStartTime = Date.now();
    this.historyLen = 60;
    this.cpuHistory = new Array(this.historyLen).fill(2);
    this.kernelHistory = new Array(this.historyLen).fill(1);
    this.memHistory = new Array(this.historyLen).fill(32);
    this.netHistory = new Array(this.historyLen).fill(0);

    this.currentCpu = 2;
    this.currentMem = 38400;
    this.peakMem = 46200;
    this.bytesSent = 145;
    this.bytesRecv = 428;
    this.mouseActivity = 0;

    this.priorityOverrides = new Map();

    this.initServices();
    this.initUserActivityListener();
    this.initGlobalShortcuts();

    this.timer = null;
    this.startUpdateLoop();

    if (window.i18n) {
      window.i18n.addListener(() => {
        if (this.isOpen()) {
          this.renderFull();
        }
      });
    }
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  initServices() {
    this.services = [
      { id: 'AudioSrv', name: 'AudioSrv', display: 'Win Audio', status: 'Running', startup: 'Auto' },
      { id: 'PlugPlay', name: 'PlugPlay', display: 'Plug and Play', status: 'Running', startup: 'Auto' },
      { id: 'EventLog', name: 'EventLog', display: 'Event Log', status: 'Running', startup: 'Auto' },
      { id: 'Spooler', name: 'Spooler', display: 'Print Spooler', status: 'Running', startup: 'Auto' },
      { id: 'Themes', name: 'Themes', display: 'Themes', status: 'Running', startup: 'Auto' },
      { id: 'LanmanServer', name: 'LanmanServer', display: 'Server', status: 'Running', startup: 'Auto' },
      { id: 'LanmanWorkstation', name: 'LanmanWorkstation', display: 'Workstation', status: 'Running', startup: 'Auto' },
      { id: 'W32Time', name: 'W32Time', display: 'Win Time', status: 'Stopped', startup: 'Manual' },
      { id: 'Browser', name: 'Browser', display: 'Computer Browser', status: 'Running', startup: 'Auto' }
    ];
  }

  initUserActivityListener() {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    window.addEventListener('mousemove', () => {
      this.mouseActivity = Math.min(this.mouseActivity + 0.8, 12);
    }, { passive: true });

    window.addEventListener('keydown', () => {
      this.mouseActivity = Math.min(this.mouseActivity + 1.2, 15);
    }, { passive: true });
  }

  initGlobalShortcuts() {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    window.addEventListener('keydown', (e) => {
      const isTaskMgrKey = (e.ctrlKey && e.shiftKey && e.key === 'Escape') ||
                           (e.ctrlKey && e.altKey && (e.key === 'Delete' || e.key === 'Del'));
      if (isTaskMgrKey) {
        e.preventDefault();
        this.open();
      }
    });
  }

  isOpen() {
    return !!(window.winManager && window.winManager.windows.has(this.winId));
  }

  open(initialTab = null) {
    if (initialTab) {
      this.activeTab = initialTab;
    }

    if (this.isOpen()) {
      window.winManager.bringToTop(this.winId);
      const existing = window.winManager.windows.get(this.winId);
      if (existing && existing.isMinimized) {
        window.winManager.restoreWindow(this.winId);
      }
      this.renderFull();
      return;
    }

    const content = document.createElement('div');
    content.className = 'taskmgr-app';

    this.win = window.winManager.createWindow({
      id: this.winId,
      title: this.t('taskmgr.title'),
      icon: 'taskmgr',
      width: 500,
      height: 480,
      minWidth: 420,
      minHeight: 380,
      resizable: true,
      minimizable: true,
      maximizable: true,
      isDialog: false,
      content,
      onClose: () => {
        this.win = null;
        this.removeTrayIcon();
      }
    });

    if (this.alwaysOnTop) {
      this.win.element.style.zIndex = 99999;
    }

    this.contentEl = content;
    this.renderFull();
    this.ensureTrayIcon();
  }

  getBackgroundProcesses() {
    return [
      { pid: 4, imageName: 'System', cpu: 0, mem: 216, priority: 'Normal', user: 'SYSTEM', isCritical: true },
      { pid: 124, imageName: 'smss.exe', cpu: 0, mem: 168, priority: 'Normal', user: 'SYSTEM', isCritical: true },
      { pid: 156, imageName: 'csrss.exe', cpu: 0.4, mem: 1840, priority: 'High', user: 'SYSTEM', isCritical: true },
      { pid: 180, imageName: 'winlogon.exe', cpu: 0, mem: 2140, priority: 'High', user: 'SYSTEM', isCritical: true },
      { pid: 208, imageName: 'services.exe', cpu: 0.2, mem: 3450, priority: 'Normal', user: 'SYSTEM', isCritical: true },
      { pid: 220, imageName: 'lsass.exe', cpu: 0, mem: 1320, priority: 'Normal', user: 'SYSTEM', isCritical: true },
      { pid: 396, imageName: 'svchost.exe', cpu: 0.3, mem: 5120, priority: 'Normal', user: 'SYSTEM', isCritical: false },
      { pid: 440, imageName: 'spoolsv.exe', cpu: 0, mem: 2840, priority: 'Normal', user: 'SYSTEM', isCritical: false },
      { pid: 592, imageName: 'explorer.exe', cpu: 1.2, mem: 9420, priority: 'Normal', user: 'User', isShell: true },
      { pid: 712, imageName: 'soundman.exe', cpu: 0, mem: 1540, priority: 'Normal', user: 'User', isCritical: false },
      { pid: 836, imageName: 'taskmgr.exe', cpu: 1.1, mem: 3280, priority: 'High', user: 'User', isTaskmgr: true },
      ...(window.clippySystem ? window.clippySystem.processList() : []),
      ...(window.appESheep ? window.appESheep.processList() : []),
      ...(window.appNeko ? window.appNeko.processList() : [])
    ];
  }

  getWindowProcesses() {
    const list = [];
    if (!window.winManager) return list;

    window.winManager.windows.forEach((win, id) => {
      if (id === this.winId) return;

      const exeInfo = this.resolveExeForWindow(win, id);
      const pri = this.priorityOverrides.get(exeInfo.pid) || exeInfo.priority || 'Normal';

      let cpu = exeInfo.baseCpu;
      if (pri === 'Realtime') cpu *= 1.6;
      else if (pri === 'High') cpu *= 1.3;
      else if (pri === 'Low') cpu *= 0.5;

      list.push({
        pid: exeInfo.pid,
        imageName: exeInfo.imageName,
        cpu: Math.round(cpu * 10) / 10,
        mem: exeInfo.mem,
        priority: pri,
        user: 'User',
        windowId: id,
        windowTitle: win.title,
        icon: win.icon || 'application'
      });
    });

    return list;
  }

  resolveExeForWindow(win, id) {
    const idLower = id.toLowerCase();
    const titleLower = (win.title || '').toLowerCase();

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0xfff;
    }
    const pid = 1024 + (hash % 8000);

    if (idLower.includes('notepad') || titleLower.includes('блокнот')) {
      return { pid, imageName: 'notepad.exe', baseCpu: 0.1, mem: 2340, priority: 'Normal' };
    }
    if (idLower.includes('calc') || titleLower.includes('калькулятор')) {
      return { pid, imageName: 'calc.exe', baseCpu: 0.1, mem: 1820, priority: 'Normal' };
    }
    if (idLower.includes('paint')) {
      return { pid, imageName: 'mspaint.exe', baseCpu: 0.3, mem: 4650, priority: 'Normal' };
    }
    if (idLower.includes('minesweeper') || titleLower.includes('сапер')) {
      return { pid, imageName: 'winmine.exe', baseCpu: 0.1, mem: 1620, priority: 'Normal' };
    }
    if (idLower.includes('solitaire') || titleLower.includes('косынка')) {
      return { pid, imageName: 'sol.exe', baseCpu: 0.2, mem: 1890, priority: 'Normal' };
    }
    if (idLower.includes('pinball')) {
      return { pid, imageName: 'pinball.exe', baseCpu: 4.5, mem: 8400, priority: 'Normal' };
    }
    if (idLower.includes('ie') || titleLower.includes('internet explorer')) {
      return { pid, imageName: 'iexplore.exe', baseCpu: 2.5, mem: 16400, priority: 'Normal' };
    }
    if (idLower.includes('netscape')) {
      return { pid, imageName: 'netscape.exe', baseCpu: 3.2, mem: 18900, priority: 'Normal' };
    }
    if (idLower.includes('winamp')) {
      return { pid, imageName: 'winamp.exe', baseCpu: 2.1, mem: 6850, priority: 'Normal' };
    }
    if (idLower.includes('half_life') || idLower.includes('half-life') || titleLower.includes('half-life')) {
      return { pid, imageName: 'hl.exe', baseCpu: 32.0, mem: 36500, priority: 'AboveNormal' };
    }
    if (idLower.includes('burnout')) {
      return { pid, imageName: 'burnout.exe', baseCpu: 26.0, mem: 28400, priority: 'AboveNormal' };
    }
    if (idLower.includes('neon') || idLower.includes('glide')) {
      return { pid, imageName: 'glide.exe', baseCpu: 28.0, mem: 27800, priority: 'AboveNormal' };
    }
    if (idLower.includes('wolf3d')) {
      return { pid, imageName: 'wolf3d.exe', baseCpu: 18.0, mem: 14200, priority: 'Normal' };
    }
    if (idLower.includes('doom')) {
      return { pid, imageName: 'doom.exe', baseCpu: 27.0, mem: 12800, priority: 'AboveNormal' };
    }
    if (idLower === 'app_avatar98') {
      return { pid, imageName: 'silent.exe', baseCpu: 9.0, mem: 18400, priority: 'Normal' };
    }
    if (idLower === 'app_dota') {
      return { pid, imageName: 'dota.exe', baseCpu: 33.0, mem: 41200, priority: 'High' };
    }
    if (idLower === 'app_lol') {
      return { pid, imageName: 'lol.exe', baseCpu: 31.0, mem: 38400, priority: 'High' };
    }
    if (idLower === 'app_tekken3') {
      return { pid, imageName: 'tekken3.exe', baseCpu: 34.0, mem: 41200, priority: 'High' };
    }
    if (idLower === 'app_ow98') {
      return { pid, imageName: 'overwatch.exe', baseCpu: 38.0, mem: 52400, priority: 'High' };
    }
    if (idLower === 'app_sammax') {
      return { pid, imageName: 'sammax.exe', baseCpu: 12.0, mem: 9600, priority: 'Normal' };
    }
    if (idLower === 'app_sammax102') {
      return { pid, imageName: 'sammax2.exe', baseCpu: 13.0, mem: 10400, priority: 'Normal' };
    }
    if (idLower === 'app_sammax103') {
      return { pid, imageName: 'sammax3.exe', baseCpu: 14.0, mem: 11200, priority: 'Normal' };
    }
    if (idLower === 'app_sammax104') {
      return { pid, imageName: 'sammax4.exe', baseCpu: 14.5, mem: 11800, priority: 'Normal' };
    }
    if (idLower === 'app_sammax105') {
      return { pid, imageName: 'sammax5.exe', baseCpu: 15.0, mem: 12400, priority: 'Normal' };
    }
    if (idLower === 'app_sammax106') {
      return { pid, imageName: 'sammax6.exe', baseCpu: 15.5, mem: 12900, priority: 'Normal' };
    }
    if (idLower === 'app_sammax201') {
      return { pid, imageName: 'sammax21.exe', baseCpu: 15.8, mem: 13300, priority: 'Normal' };
    }
    if (idLower === 'app_sammax202') {
      return { pid, imageName: 'sammax22.exe', baseCpu: 16.0, mem: 13600, priority: 'Normal' };
    }
    if (idLower === 'app_bttf') {
      return { pid, imageName: 'bttf.exe', baseCpu: 17.5, mem: 15200, priority: 'Normal' };
    }
    if (idLower === 'app_diablo2') {
      return { pid, imageName: 'diablo ii.exe', baseCpu: 28.0, mem: 38400, priority: 'High' };
    }
    if (idLower === 'app_xiii') {
      return { pid, imageName: 'xiii.exe', baseCpu: 34.0, mem: 49200, priority: 'High' };
    }
    if (idLower === 'app_maxpayne') {
      return { pid, imageName: 'maxpayne.exe', baseCpu: 36.0, mem: 61400, priority: 'High' };
    }
    if (idLower === 'app_gtann') {
      return { pid, imageName: 'gtann.exe', baseCpu: 46.0, mem: 88400, priority: 'High' };
    }
    if (idLower === 'app_legion') {
      return { pid, imageName: 'arena.exe', baseCpu: 34.0, mem: 74200, priority: 'High' };
    }
    if (idLower === 'app_falloutzp') {
      return { pid, imageName: 'falloutzp.exe', baseCpu: 38.0, mem: 88600, priority: 'High' };
    }
    if (idLower === 'app_anotherwar') {
      return { pid, imageName: 'aw.exe', baseCpu: 26.0, mem: 61400, priority: 'Normal' };
    }
    if (idLower === 'app_korovany') {
      return { pid, imageName: 'korovany.exe', baseCpu: 34.0, mem: 96400, priority: 'Normal' };
    }
    if (idLower === 'app_korovany') {
      return { pid, imageName: 'korovany.exe', baseCpu: 34.0, mem: 96400, priority: 'Normal' };
    }
    if (idLower === 'app_catniss') {
      return { pid, imageName: 'catniss.exe', baseCpu: 14.0, mem: 18400, priority: 'Normal' };
    }
    if (idLower === 'app_plov') {
      return { pid, imageName: 'plov.exe', baseCpu: 18.0, mem: 23800, priority: 'Normal' };
    }
    if (idLower === 'app_sims3') {
      return { pid, imageName: 'sims3.exe', baseCpu: 38.0, mem: 57300, priority: 'Normal' };
    }
    if (idLower === 'app_forza') {
      return { pid, imageName: 'forza.exe', baseCpu: 44.0, mem: 61200, priority: 'High' };
    }
    if (idLower === 'app_dmc98') {
      return { pid, imageName: 'dmc4.exe', baseCpu: 41.0, mem: 68800, priority: 'High' };
    }
    if (idLower === 'app_dao98') {
      return { pid, imageName: 'daorigins.exe', baseCpu: 38.0, mem: 72400, priority: 'High' };
    }
    if (idLower === 'app_quake3') {
      return { pid, imageName: 'quake3.exe', baseCpu: 44.0, mem: 58600, priority: 'High' };
    }
    if (idLower === 'app_hl2') {
      return { pid, imageName: 'hl2.exe', baseCpu: 41.0, mem: 64800, priority: 'High' };
    }
    if (idLower === 'app_gta90') {
      return { pid, imageName: 'gta90.exe', baseCpu: 29.0, mem: 32800, priority: 'High' };
    }
    if (idLower === 'app_kotor98') {
      return { pid, imageName: 'swkotor.exe', baseCpu: 36.0, mem: 61200, priority: 'High' };
    }
    if (idLower === 'app_hsr98') {
      return { pid, imageName: 'starrail.exe', baseCpu: 24.0, mem: 34600, priority: 'High' };
    }
    if (idLower === 'app_mc98') {
      return { pid, imageName: 'minecraft.exe', baseCpu: 33.0, mem: 52800, priority: 'High' };
    }
    if (idLower === 'app_cop98') {
      return { pid, imageName: 'zaton.exe', baseCpu: 38.0, mem: 61400, priority: 'High' };
    }
    if (idLower === 'app_moh98') {
      return { pid, imageName: 'moh.exe', baseCpu: 35.0, mem: 47200, priority: 'High' };
    }
    if (idLower === 'app_stalker98') {
      return { pid, imageName: 'xr98.exe', baseCpu: 36.0, mem: 52800, priority: 'High' };
    }
    if (idLower.includes('serioussam')) {
      return { pid, imageName: 'sam.exe', baseCpu: 34.0, mem: 48600, priority: 'High' };
    }
    if (idLower.includes('diablo')) {
      return { pid, imageName: 'diablo.exe', baseCpu: 24.0, mem: 31200, priority: 'AboveNormal' };
    }
    if (idLower.includes('hockey')) {
      return { pid, imageName: 'hockey98.exe', baseCpu: 12.0, mem: 16500, priority: 'Normal' };
    }
    if (idLower.includes('worldcup98')) {
      return { pid, imageName: 'worldcup98.exe', baseCpu: 16.0, mem: 22400, priority: 'Normal' };
    }
    if (idLower.includes('blender')) {
      return { pid, imageName: 'blender.exe', baseCpu: 35.0, mem: 29500, priority: 'High' };
    }
    if (idLower.includes('fallout')) {
      return { pid, imageName: 'fallout2.exe', baseCpu: 20.0, mem: 24500, priority: 'Normal' };
    }
    if (idLower.includes('stalker')) {
      return { pid, imageName: 'xr_3da.exe', baseCpu: 38.0, mem: 46000, priority: 'High' };
    }
    if (idLower.includes('bugreport')) {
      return { pid, imageName: 'bugreport.exe', baseCpu: 3.0, mem: 3100, priority: 'Normal' };
    }
    if (idLower.includes('backup')) {
      return { pid, imageName: 'msbackup.exe', baseCpu: 9.0, mem: 6400, priority: 'Normal' };
    }
    if (idLower.includes('defrag')) {
      return { pid, imageName: 'defrag.exe', baseCpu: 14.0, mem: 7200, priority: 'Normal' };
    }
    if (idLower.includes('photoshop')) {
      return { pid, imageName: 'photoshop.exe', baseCpu: 6.0, mem: 21500, priority: 'Normal' };
    }
    if (idLower.includes('explorer') || titleLower.includes('проводник')) {
      return { pid, imageName: 'explorer.exe', baseCpu: 1.0, mem: 8100, priority: 'Normal' };
    }
    if (idLower.includes('excel')) {
      return { pid, imageName: 'excel.exe', baseCpu: 1.2, mem: 9200, priority: 'Normal' };
    }
    if (idLower.includes('icq')) {
      return { pid, imageName: 'icq.exe', baseCpu: 0.4, mem: 5400, priority: 'Normal' };
    }
    if (idLower.includes('outlook')) {
      return { pid, imageName: 'msimn.exe', baseCpu: 0.5, mem: 6200, priority: 'Normal' };
    }
    if (idLower === 'app_esheep_cp' || idLower.includes('esheep')) {
      return { pid, imageName: 'sheep.exe', baseCpu: 0.4, mem: 1420, priority: 'Normal' };
    }

    const rawName = id.replace(/^(app_|win_)/, '').split('_')[0];
    return {
      pid,
      imageName: `${rawName.substring(0, 12)}.exe`,
      baseCpu: 0.5,
      mem: 4200,
      priority: 'Normal'
    };
  }

  getAllProcesses() {
    const bg = this.getBackgroundProcesses();
    const wins = this.getWindowProcesses();

    bg.forEach(p => {
      if (this.priorityOverrides.has(p.pid)) {
        p.priority = this.priorityOverrides.get(p.pid);
      }
    });

    const all = [...bg, ...wins];
    return this.showAllUsers ? all : all.filter(p => p.user === 'User');
  }
  updateMetrics() {
    const procs = this.getAllProcesses();
    let totalCpu = 1.2;
    procs.forEach(p => {
      totalCpu += p.cpu;
    });
    totalCpu += this.mouseActivity;
    this.mouseActivity = Math.max(0, this.mouseActivity - 0.5);
    totalCpu += (Math.random() * 1.5 - 0.7);
    this.currentCpu = Math.max(1, Math.min(100, Math.round(totalCpu)));

    const kernelShare = Math.max(0.5, Math.round(this.currentCpu * 0.28 * 10) / 10);
    let totalMem = 28000;
    procs.forEach(p => {
      totalMem += p.mem;
    });
    totalMem += Math.round(Math.random() * 200);
    this.currentMem = totalMem;
    if (this.currentMem > this.peakMem) {
      this.peakMem = this.currentMem;
    }
    let netActive = 0;
    const isBrowserOpen = procs.some(p => p.imageName === 'iexplore.exe' || p.imageName === 'netscape.exe' || p.imageName === 'icq.exe');
    if (isBrowserOpen) {
      netActive = Math.round(Math.random() * 12 + 2);
      this.bytesSent += Math.round(Math.random() * 18 + 2);
      this.bytesRecv += Math.round(Math.random() * 45 + 5);
    } else {
      netActive = Math.round(Math.random() * 0.8);
      this.bytesRecv += Math.round(Math.random() * 2);
    }
    this.cpuHistory.shift();
    this.cpuHistory.push(this.currentCpu);

    this.kernelHistory.shift();
    this.kernelHistory.push(kernelShare);

    const memMB = Math.round(this.currentMem / 1024);
    this.memHistory.shift();
    this.memHistory.push(memMB);

    this.netHistory.shift();
    this.netHistory.push(netActive);
    this.renderTrayCanvas();
    if (this.isOpen() && this.contentEl) {
      this.updateStatusPane();
      if (this.activeTab === 'performance') {
        this.renderPerformanceCanvases();
        this.updatePerformanceStats();
      } else if (this.activeTab === 'networking') {
        this.renderNetworkingCanvas();
        this.updateNetworkingStats();
      } else if (this.activeTab === 'processes') {
        this.renderProcessTableRows();
      } else if (this.activeTab === 'applications') {
        this.renderApplicationTableRows();
      }
    }
  }

  startUpdateLoop() {
    if (this.timer) clearInterval(this.timer);
    if (this.updateSpeed > 0) {
      this.timer = setInterval(() => this.updateMetrics(), this.updateSpeed);
      if (this.timer && typeof this.timer.unref === 'function') {
        this.timer.unref();
      }
    }
  }

  setUpdateSpeed(ms) {
    this.updateSpeed = ms;
    this.startUpdateLoop();
    if (this.isOpen()) this.renderFull();
  }
  renderFull() {
    if (!this.contentEl) return;

    this.contentEl.innerHTML = `
      ${this.renderMenuBarHtml()}
      ${this.renderTabStripHtml()}
      <div class="taskmgr-body">
        <div class="taskmgr-tab-pane ${this.activeTab === 'applications' ? 'active' : ''}" id="taskmgr-pane-apps">
          ${this.renderApplicationsPaneHtml()}
        </div>
        <div class="taskmgr-tab-pane ${this.activeTab === 'processes' ? 'active' : ''}" id="taskmgr-pane-procs">
          ${this.renderProcessesPaneHtml()}
        </div>
        <div class="taskmgr-tab-pane ${this.activeTab === 'performance' ? 'active' : ''}" id="taskmgr-pane-perf">
          ${this.renderPerformancePaneHtml()}
        </div>
        <div class="taskmgr-tab-pane ${this.activeTab === 'networking' ? 'active' : ''}" id="taskmgr-pane-net">
          ${this.renderNetworkingPaneHtml()}
        </div>
        <div class="taskmgr-tab-pane ${this.activeTab === 'services' ? 'active' : ''}" id="taskmgr-pane-services">
          ${this.renderServicesPaneHtml()}
        </div>
      </div>
      ${this.renderStatusBarHtml()}
    `;

    this.attachDomEvents();
    this.updateStatusPane();

    if (this.activeTab === 'applications') {
      this.renderApplicationTableRows();
    } else if (this.activeTab === 'processes') {
      this.renderProcessTableRows();
    } else if (this.activeTab === 'performance') {
      this.renderPerformanceCanvases();
      this.updatePerformanceStats();
    } else if (this.activeTab === 'networking') {
      this.renderNetworkingCanvas();
      this.updateNetworkingStats();
    } else if (this.activeTab === 'services') {
      this.renderServicesTableRows();
    }
  }
  renderMenuBarHtml() {
    return `
      <div class="taskmgr-menubar">
        <div class="taskmgr-menu-item" data-menu="file">
          ${this.t('taskmgr.menuFile')}
          <div class="taskmgr-menu-dropdown">
            <div class="taskmgr-menu-option" data-action="new-task">
              ${this.t('taskmgr.menuNewTask')}
            </div>
            <div class="win-menu-separator"></div>
            <div class="taskmgr-menu-option" data-action="exit">
              ${this.t('taskmgr.menuExit')}
            </div>
          </div>
        </div>

        <div class="taskmgr-menu-item" data-menu="options">
          ${this.t('taskmgr.menuOptions')}
          <div class="taskmgr-menu-dropdown">
            <div class="taskmgr-menu-option ${this.alwaysOnTop ? 'checked' : ''}" data-action="always-on-top">
              ${this.t('taskmgr.menuAlwaysOnTop')}
            </div>
            <div class="taskmgr-menu-option ${this.minimizeOnUse ? 'checked' : ''}" data-action="min-on-use">
              ${this.t('taskmgr.menuMinimizeOnUse')}
            </div>
            <div class="taskmgr-menu-option ${this.hideWhenMinimized ? 'checked' : ''}" data-action="hide-min">
              ${this.t('taskmgr.menuHideWhenMinimized')}
            </div>
          </div>
        </div>

        <div class="taskmgr-menu-item" data-menu="view">
          ${this.t('taskmgr.menuView')}
          <div class="taskmgr-menu-dropdown">
            <div class="taskmgr-menu-option" data-action="refresh-now">
              ${this.t('taskmgr.menuRefreshNow')} <span class="shortcut">F5</span>
            </div>
            <div class="win-menu-separator"></div>
            <div class="taskmgr-menu-option ${this.updateSpeed === 500 ? 'checked' : ''}" data-action="speed-500">
              ${this.t('taskmgr.speedHigh')}
            </div>
            <div class="taskmgr-menu-option ${this.updateSpeed === 1000 ? 'checked' : ''}" data-action="speed-1000">
              ${this.t('taskmgr.speedNormal')}
            </div>
            <div class="taskmgr-menu-option ${this.updateSpeed === 2000 ? 'checked' : ''}" data-action="speed-2000">
              ${this.t('taskmgr.speedLow')}
            </div>
            <div class="taskmgr-menu-option ${this.updateSpeed === 0 ? 'checked' : ''}" data-action="speed-0">
              ${this.t('taskmgr.speedPaused')}
            </div>
            <div class="win-menu-separator"></div>
            <div class="taskmgr-menu-option ${this.showKernelTimes ? 'checked' : ''}" data-action="toggle-kernel">
              ${this.t('taskmgr.menuKernelTimes')}
            </div>
          </div>
        </div>

        <div class="taskmgr-menu-item" data-menu="windows">
          ${this.t('taskmgr.menuWindows')}
          <div class="taskmgr-menu-dropdown">
            <div class="taskmgr-menu-option" data-action="win-cascade">${this.t('taskmgr.menuCascade')}</div>
            <div class="taskmgr-menu-option" data-action="win-tile-h">${this.t('taskmgr.menuTileH')}</div>
            <div class="taskmgr-menu-option" data-action="win-tile-v">${this.t('taskmgr.menuTileV')}</div>
            <div class="taskmgr-menu-option" data-action="win-minimize-all">${this.t('taskmgr.menuMinimizeAll')}</div>
          </div>
        </div>

        <div class="taskmgr-menu-item" data-menu="help">
          ${this.t('taskmgr.menuHelp')}
          <div class="taskmgr-menu-dropdown">
            <div class="taskmgr-menu-option" data-action="help-topics">${this.t('taskmgr.menuHelpTopics')}</div>
            <div class="win-menu-separator"></div>
            <div class="taskmgr-menu-option" data-action="about">${this.t('taskmgr.menuAbout')}</div>
          </div>
        </div>
      </div>
    `;
  }
  renderTabStripHtml() {
    return `
      <div class="taskmgr-tab-strip">
        <button class="taskmgr-tab-btn ${this.activeTab === 'applications' ? 'active' : ''}" data-tab="applications">
          ${this.t('taskmgr.tabApplications')}
        </button>
        <button class="taskmgr-tab-btn ${this.activeTab === 'processes' ? 'active' : ''}" data-tab="processes">
          ${this.t('taskmgr.tabProcesses')}
        </button>
        <button class="taskmgr-tab-btn ${this.activeTab === 'performance' ? 'active' : ''}" data-tab="performance">
          ${this.t('taskmgr.tabPerformance')}
        </button>
        <button class="taskmgr-tab-btn ${this.activeTab === 'networking' ? 'active' : ''}" data-tab="networking">
          ${this.t('taskmgr.tabNetworking')}
        </button>
        <button class="taskmgr-tab-btn ${this.activeTab === 'services' ? 'active' : ''}" data-tab="services">
          ${this.t('taskmgr.tabServices')}
        </button>
      </div>
    `;
  }
  renderApplicationsPaneHtml() {
    return `
      <div class="taskmgr-table-container">
        <table class="taskmgr-table" id="taskmgr-apps-table">
          <thead>
            <tr>
              <th class="taskmgr-th" style="width: 70%;">${this.t('taskmgr.colTask')}</th>
              <th class="taskmgr-th" style="width: 30%;">${this.t('taskmgr.colStatus')}</th>
            </tr>
          </thead>
          <tbody id="taskmgr-apps-tbody"></tbody>
        </table>
      </div>
      <div class="taskmgr-actions-bar">
        <button class="win-btn" id="taskmgr-btn-end-task" disabled>${this.t('taskmgr.btnEndTask')}</button>
        <button class="win-btn" id="taskmgr-btn-switch-to" disabled>${this.t('taskmgr.btnSwitchTo')}</button>
        <button class="win-btn" id="taskmgr-btn-new-task">${this.t('taskmgr.btnNewTask')}</button>
      </div>
    `;
  }

  renderApplicationTableRows() {
    const tbody = this.contentEl ? this.contentEl.querySelector('#taskmgr-apps-tbody') : null;
    if (!tbody || !window.winManager) return;

    tbody.innerHTML = '';
    const btnEnd = this.contentEl.querySelector('#taskmgr-btn-end-task');
    const btnSwitch = this.contentEl.querySelector('#taskmgr-btn-switch-to');

    let count = 0;
    let isSelectedFound = false;

    window.winManager.windows.forEach((win, id) => {
      if (id === this.winId) return;
      count++;

      const tr = document.createElement('tr');
      tr.className = 'taskmgr-row' + (this.selectedAppId === id ? ' selected' : '');
      tr.dataset.id = id;

      if (this.selectedAppId === id) isSelectedFound = true;

      const iconSvg = Icons[win.icon] || Icons['application'] || Icons['notepad'];
      tr.innerHTML = `
        <td>
          <span class="taskmgr-app-icon">${iconSvg}</span>
          <span>${win.title || id}</span>
        </td>
        <td>${this.t('taskmgr.running')}</td>
      `;

      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedAppId = id;
        btnEnd.disabled = false;
        btnSwitch.disabled = false;
      });

      tr.addEventListener('dblclick', () => {
        this.switchToApp(id);
      });

      tr.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedAppId = id;
        btnEnd.disabled = false;
        btnSwitch.disabled = false;
        this.showAppContextMenu(e.clientX, e.clientY, id);
      });

      tbody.appendChild(tr);
    });

    if (!isSelectedFound) {
      this.selectedAppId = null;
      if (btnEnd) btnEnd.disabled = true;
      if (btnSwitch) btnSwitch.disabled = true;
    }

    if (count === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="color:#777; padding:8px; text-align:center;">${this.t('taskmgr.noRunningTasks')}</td></tr>`;
    }
  }

  showAppContextMenu(x, y, id) {
    if (!window.contextMenu) return;
    window.contextMenu.show(x, y, [
      {
        label: this.t('taskmgr.btnSwitchTo'),
        bold: true,
        action: () => this.switchToApp(id)
      },
      {
        label: this.t('taskmgr.bringToFront'),
        action: () => window.winManager && window.winManager.bringToTop(id)
      },
      {
        label: this.t('win.minimize'),
        action: () => window.winManager && window.winManager.minimizeWindow(id)
      },
      {
        label: this.t('win.maximize'),
        action: () => window.winManager && window.winManager.toggleMaximize(id)
      },
      { separator: true },
      {
        label: this.t('taskmgr.btnEndTask'),
        action: () => this.endAppTask(id)
      },
      {
        label: this.t('taskmgr.goToProcess'),
        action: () => {
          this.activeTab = 'processes';
          this.renderFull();
          const win = window.winManager.windows.get(id);
          if (win) {
            const exe = this.resolveExeForWindow(win, id);
            this.selectedProcPid = exe.pid;
            this.renderProcessTableRows();
          }
        }
      }
    ]);
  }

  switchToApp(id) {
    if (!window.winManager) return;
    window.winManager.restoreWindow(id);
    window.winManager.bringToTop(id);
    if (this.minimizeOnUse) {
      window.winManager.minimizeWindow(this.winId);
    }
  }

  endAppTask(id) {
    if (!window.winManager) return;
    window.winManager.closeWindow(id);
    if (window.soundSys) window.soundSys.playClick();
    this.renderApplicationTableRows();
    this.updateMetrics();
  }
  renderProcessesPaneHtml() {
    return `
      <div class="taskmgr-table-container">
        <table class="taskmgr-table" id="taskmgr-procs-table">
          <thead>
            <tr>
              <th class="taskmgr-th" data-col="imageName" style="width: 28%;">${this.t('taskmgr.colImageName')}</th>
              <th class="taskmgr-th" data-col="pid" style="width: 14%; text-align:right;">${this.t('taskmgr.colPid')}</th>
              <th class="taskmgr-th" data-col="cpu" style="width: 12%; text-align:right;">${this.t('taskmgr.colCpu')}</th>
              <th class="taskmgr-th" data-col="mem" style="width: 18%; text-align:right;">${this.t('taskmgr.colMemory')}</th>
              <th class="taskmgr-th" data-col="priority" style="width: 14%;">${this.t('taskmgr.colPriority')}</th>
              <th class="taskmgr-th" data-col="user" style="width: 14%;">${this.t('taskmgr.colUser')}</th>
            </tr>
          </thead>
          <tbody id="taskmgr-procs-tbody"></tbody>
        </table>
      </div>
      <div class="taskmgr-actions-bar">
        <label class="taskmgr-checkbox-label">
          <input type="checkbox" id="taskmgr-chk-all-users" ${this.showAllUsers ? 'checked' : ''}>
          <span>${this.t('taskmgr.showAllUsers')}</span>
        </label>
        <button class="win-btn" id="taskmgr-btn-end-proc" disabled>${this.t('taskmgr.btnEndProcess')}</button>
      </div>
    `;
  }

  renderProcessTableRows() {
    const tbody = this.contentEl ? this.contentEl.querySelector('#taskmgr-procs-tbody') : null;
    if (!tbody) return;
    this.contentEl.querySelectorAll('.taskmgr-th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.col === this.sortColumn) {
        th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');
      }
    });

    const procs = this.getAllProcesses();
    procs.sort((a, b) => {
      let vA = a[this.sortColumn];
      let vB = b[this.sortColumn];
      if (typeof vA === 'string') {
        return this.sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return this.sortAsc ? (vA - vB) : (vB - vA);
    });

    tbody.innerHTML = '';
    const btnEnd = this.contentEl.querySelector('#taskmgr-btn-end-proc');
    let isSelectedFound = false;

    procs.forEach(p => {
      const tr = document.createElement('tr');
      tr.className = 'taskmgr-row' + (this.selectedProcPid === p.pid ? ' selected' : '');
      tr.dataset.pid = p.pid;

      if (this.selectedProcPid === p.pid) isSelectedFound = true;

      const memFormatted = Number(p.mem).toLocaleString(window.i18n && window.i18n.getLanguage() === 'en' ? 'en-US' : 'ru-RU') + ' ' + this.t('taskmgr.unitKb');
      const cpuFormatted = String(p.cpu.toFixed ? p.cpu.toFixed(0) : p.cpu).padStart(2, '0');

      tr.innerHTML = `
        <td title="${p.imageName}">${p.imageName}</td>
        <td style="text-align:right;">${p.pid}</td>
        <td style="text-align:right;">${cpuFormatted}</td>
        <td style="text-align:right;">${memFormatted}</td>
        <td>${this.formatPriority(p.priority)}</td>
        <td>${p.user}</td>
      `;

      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedProcPid = p.pid;
        btnEnd.disabled = false;
      });

      tr.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedProcPid = p.pid;
        btnEnd.disabled = false;
        this.showProcessContextMenu(e.clientX, e.clientY, p);
      });

      tbody.appendChild(tr);
    });

    if (!isSelectedFound) {
      this.selectedProcPid = null;
      if (btnEnd) btnEnd.disabled = true;
    }
  }

  formatPriority(pri) {
    switch (pri) {
      case 'Low': return this.t('taskmgr.priorityLow');
      case 'BelowNormal': return this.t('taskmgr.priorityBelowNormal');
      case 'Normal': return this.t('taskmgr.priorityNormal');
      case 'AboveNormal': return this.t('taskmgr.priorityAboveNormal');
      case 'High': return this.t('taskmgr.priorityHigh');
      case 'Realtime': return this.t('taskmgr.priorityRealtime');
      default: return pri;
    }
  }

  showProcessContextMenu(x, y, proc) {
    if (!window.contextMenu) return;

    const priorities = ['Realtime', 'High', 'AboveNormal', 'Normal', 'BelowNormal', 'Low'];
    const currentPri = proc.priority || 'Normal';

    window.contextMenu.show(x, y, [
      {
        label: this.t('taskmgr.btnEndProcess'),
        bold: true,
        action: () => this.terminateProcess(proc)
      },
      {
        label: this.t('taskmgr.endProcessTree'),
        action: () => this.terminateProcess(proc)
      },
      { separator: true },
      {
        label: this.t('taskmgr.setPriority'),
        submenu: priorities.map(pri => ({
          label: (pri === currentPri ? '• ' : '  ') + this.formatPriority(pri),
          action: () => {
            this.priorityOverrides.set(proc.pid, pri);
            this.renderProcessTableRows();
            this.updateMetrics();
          }
        }))
      },
      ...(proc.windowId ? [
        { separator: true },
        {
          label: this.t('taskmgr.goToWindow'),
          action: () => this.switchToApp(proc.windowId)
        }
      ] : [])
    ]);
  }

  terminateProcess(proc) {
    if (proc.isCritical) {
      if (window.winManager) {
        window.winManager.openDialog({
          title: this.t('taskmgr.title'),
          icon: 'error',
          message: this.t('taskmgr.warnCritical')
        });
      }
      return;
    }

    if (proc.isTaskmgr) {
      if (window.winManager) window.winManager.closeWindow(this.winId);
      return;
    }

    if (proc.isClippy) {
      if (window.appClippy) window.appClippy.onEndTask();
      return;
    }

    if (proc.isESheep) {
      if (window.appESheep) window.appESheep.stop();
      if (window.soundSys) window.soundSys.playClick();
      this.selectedProcPid = null;
      this.updateMetrics();
      this.renderProcessTableRows();
      return;
    }

    if (proc.isNeko) {
      if (window.appNeko) window.appNeko.stop();
      if (window.soundSys) window.soundSys.playClick();
      this.selectedProcPid = null;
      this.updateMetrics();
      this.renderProcessTableRows();
      return;
    }

    if (proc.isShell) {
      const desktop = document.getElementById('desktop');
      const taskbar = document.getElementById('taskbar');
      if (desktop) desktop.style.opacity = '0';
      if (taskbar) taskbar.style.opacity = '0';
      if (window.soundSys) window.soundSys.playChord();

      setTimeout(() => {
        if (desktop) desktop.style.opacity = '1';
        if (taskbar) taskbar.style.opacity = '1';
        this.renderProcessTableRows();
      }, 900);
      return;
    }

    const confirmMsg = this.t('taskmgr.confirmEndProcess', proc.imageName);
    const confirmed = confirm ? confirm(confirmMsg.replace(/<[^>]+>/g, '')) : true;
    if (confirmed) {
      if (proc.windowId && window.winManager) {
        window.winManager.closeWindow(proc.windowId);
      }
      if (window.soundSys) window.soundSys.playClick();
      this.selectedProcPid = null;
      this.updateMetrics();
      this.renderProcessTableRows();
    }
  }
  renderPerformancePaneHtml() {
    return `
      <div class="taskmgr-perf-container">
        <div class="taskmgr-perf-charts-row">
                    <fieldset class="taskmgr-perf-box">
            <legend>${this.t('taskmgr.perfCpuHistory')}</legend>
            <div class="taskmgr-perf-box-inner">
              <div class="taskmgr-gauge-container">
                <div class="taskmgr-gauge-meter" id="taskmgr-cpu-meter"></div>
                <div class="taskmgr-gauge-value" id="taskmgr-cpu-val">${this.currentCpu}%</div>
              </div>
              <div class="taskmgr-graph-frame">
                <canvas class="taskmgr-graph-canvas" id="taskmgr-cpu-canvas"></canvas>
              </div>
            </div>
          </fieldset>

                    <fieldset class="taskmgr-perf-box">
            <legend>${this.t('taskmgr.perfMemHistory')}</legend>
            <div class="taskmgr-perf-box-inner">
              <div class="taskmgr-gauge-container">
                <div class="taskmgr-gauge-meter" id="taskmgr-mem-meter"></div>
                <div class="taskmgr-gauge-value" id="taskmgr-mem-val">${Math.round(this.currentMem / 1024)}M</div>
              </div>
              <div class="taskmgr-graph-frame">
                <canvas class="taskmgr-graph-canvas" id="taskmgr-mem-canvas"></canvas>
              </div>
            </div>
          </fieldset>
        </div>

                <div class="taskmgr-stats-grid">
                    <fieldset class="taskmgr-stats-box">
            <legend>${this.t('taskmgr.perfCommit')}</legend>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.total')}</span>
              <span class="taskmgr-stat-val" id="stat-commit-total">0</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.limit')}</span>
              <span class="taskmgr-stat-val">315 280</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.peak')}</span>
              <span class="taskmgr-stat-val" id="stat-commit-peak">0</span>
            </div>
          </fieldset>

                    <fieldset class="taskmgr-stats-box">
            <legend>${this.t('taskmgr.perfPhysical')}</legend>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.total')}</span>
              <span class="taskmgr-stat-val">130 548</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.available')}</span>
              <span class="taskmgr-stat-val" id="stat-phys-avail">0</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.systemCache')}</span>
              <span class="taskmgr-stat-val">42 180</span>
            </div>
          </fieldset>

                    <fieldset class="taskmgr-stats-box">
            <legend>${this.t('taskmgr.perfKernel')}</legend>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.total')}</span>
              <span class="taskmgr-stat-val">18 420</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.paged')}</span>
              <span class="taskmgr-stat-val">12 110</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.nonpaged')}</span>
              <span class="taskmgr-stat-val">6 310</span>
            </div>
          </fieldset>

                    <fieldset class="taskmgr-stats-box">
            <legend>${this.t('taskmgr.perfTotals')}</legend>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.handles')}</span>
              <span class="taskmgr-stat-val" id="stat-handles">4 120</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.threads')}</span>
              <span class="taskmgr-stat-val" id="stat-threads">172</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.processes')}</span>
              <span class="taskmgr-stat-val" id="stat-procs">0</span>
            </div>
            <div class="taskmgr-stat-row">
              <span class="taskmgr-stat-label">${this.t('taskmgr.uptime')}</span>
              <span class="taskmgr-stat-val" id="stat-uptime">00:00:00</span>
            </div>
          </fieldset>
        </div>
      </div>
    `;
  }

  renderPerformanceCanvases() {
    if (!this.contentEl) return;
    const cpuCanvas = this.contentEl.querySelector('#taskmgr-cpu-canvas');
    if (cpuCanvas) {
      this.drawOscilloscope(cpuCanvas, this.cpuHistory, 100, '#00ff00', this.showKernelTimes ? this.kernelHistory : null, '#ff3333');
    }
    const cpuMeter = this.contentEl.querySelector('#taskmgr-cpu-meter');
    const cpuVal = this.contentEl.querySelector('#taskmgr-cpu-val');
    if (cpuMeter && cpuVal) {
      this.renderVuMeter(cpuMeter, this.currentCpu, 100);
      cpuVal.textContent = `${this.currentCpu}%`;
    }
    const memCanvas = this.contentEl.querySelector('#taskmgr-mem-canvas');
    if (memCanvas) {
      this.drawOscilloscope(memCanvas, this.memHistory, 128, '#00ff00', null, null);
    }
    const memMeter = this.contentEl.querySelector('#taskmgr-mem-meter');
    const memVal = this.contentEl.querySelector('#taskmgr-mem-val');
    if (memMeter && memVal) {
      const memMB = Math.round(this.currentMem / 1024);
      this.renderVuMeter(memMeter, memMB, 128);
      memVal.textContent = `${memMB}M`;
    }
  }

  drawOscilloscope(canvas, data, maxVal, lineColor, secondaryData = null, secondaryColor = '#ff3333') {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 180;
    const h = rect.height || 100;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    const gridSize = 12;
    ctx.beginPath();
    for (let x = 0; x <= w; x += gridSize) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    if (secondaryData && secondaryData.length > 1) {
      this.drawSeries(ctx, secondaryData, maxVal, w, h, secondaryColor);
    }
    if (data && data.length > 1) {
      this.drawSeries(ctx, data, maxVal, w, h, lineColor);
    }
  }

  drawSeries(ctx, data, maxVal, w, h, color) {
    const step = w / (data.length - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const val = Math.max(0, Math.min(maxVal, data[i]));
      const x = i * step;
      const y = h - (val / maxVal) * (h - 2) - 1;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  renderVuMeter(container, value, maxVal) {
    container.innerHTML = '';
    const totalBlocks = 24;
    const litCount = Math.round((value / maxVal) * totalBlocks);

    for (let i = 0; i < totalBlocks; i++) {
      const block = document.createElement('div');
      block.className = 'taskmgr-gauge-block';

      if (i < litCount) {
        if (i > totalBlocks * 0.85) {
          block.classList.add('lit-crit');
        } else if (i > totalBlocks * 0.7) {
          block.classList.add('lit-warn');
        } else {
          block.classList.add('lit');
        }
      }
      container.appendChild(block);
    }
  }

  updatePerformanceStats() {
    if (!this.contentEl) return;

    const commitTotal = this.contentEl.querySelector('#stat-commit-total');
    const commitPeak = this.contentEl.querySelector('#stat-commit-peak');
    const physAvail = this.contentEl.querySelector('#stat-phys-avail');
    const procsCount = this.contentEl.querySelector('#stat-procs');
    const uptimeEl = this.contentEl.querySelector('#stat-uptime');

    if (commitTotal) commitTotal.textContent = Number(this.currentMem).toLocaleString('ru-RU');
    if (commitPeak) commitPeak.textContent = Number(this.peakMem).toLocaleString('ru-RU');

    const availKB = Math.max(1024, 130548 - this.currentMem);
    if (physAvail) physAvail.textContent = Number(availKB).toLocaleString('ru-RU');

    const procs = this.getAllProcesses();
    if (procsCount) procsCount.textContent = procs.length;
    if (uptimeEl) {
      const diffSec = Math.floor((Date.now() - this.systemStartTime) / 1000);
      const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      uptimeEl.textContent = `${hours}:${mins}:${secs}`;
    }
  }
  renderNetworkingPaneHtml() {
    return `
      <div class="taskmgr-net-container">
        <fieldset class="taskmgr-net-graph-box">
          <legend>${this.t('taskmgr.netUtil')}</legend>
          <div class="taskmgr-graph-frame" style="height: 160px;">
            <canvas class="taskmgr-graph-canvas" id="taskmgr-net-canvas"></canvas>
          </div>
        </fieldset>

        <fieldset class="taskmgr-net-stats-box">
          <legend>${this.t('taskmgr.netAdapter')}: Realtek RTL8139 Fast Ethernet 10/100</legend>
          <div class="taskmgr-stat-row">
            <span class="taskmgr-stat-label">${this.t('taskmgr.netState')}</span>
            <span class="taskmgr-stat-val">${this.t('taskmgr.netSpeed')}</span>
          </div>
          <div class="taskmgr-stat-row">
            <span class="taskmgr-stat-label" id="taskmgr-net-sent">${this.t('taskmgr.netBytesSent', this.bytesSent)}</span>
            <span class="taskmgr-stat-val" id="taskmgr-net-recv">${this.t('taskmgr.netBytesRecv', this.bytesRecv)}</span>
          </div>
        </fieldset>
      </div>
    `;
  }

  renderNetworkingCanvas() {
    if (!this.contentEl) return;
    const canvas = this.contentEl.querySelector('#taskmgr-net-canvas');
    if (canvas) {
      this.drawOscilloscope(canvas, this.netHistory, 100, '#00ff00', null, null);
    }
  }

  updateNetworkingStats() {
    if (!this.contentEl) return;
    const sentEl = this.contentEl.querySelector('#taskmgr-net-sent');
    const recvEl = this.contentEl.querySelector('#taskmgr-net-recv');
    if (sentEl) sentEl.textContent = this.t('taskmgr.netBytesSent', this.bytesSent);
    if (recvEl) recvEl.textContent = this.t('taskmgr.netBytesRecv', this.bytesRecv);
  }
  renderServicesPaneHtml() {
    return `
      <div class="taskmgr-table-container">
        <table class="taskmgr-table" id="taskmgr-services-table">
          <thead>
            <tr>
              <th class="taskmgr-th" style="width: 25%;">${this.t('taskmgr.colServiceName')}</th>
              <th class="taskmgr-th" style="width: 35%;">${this.t('taskmgr.colDisplayName')}</th>
              <th class="taskmgr-th" style="width: 20%;">${this.t('taskmgr.colStatus')}</th>
              <th class="taskmgr-th" style="width: 20%;">${this.t('taskmgr.colStartup')}</th>
            </tr>
          </thead>
          <tbody id="taskmgr-services-tbody"></tbody>
        </table>
      </div>
      <div class="taskmgr-actions-bar">
        <button class="win-btn" id="taskmgr-btn-start-service" disabled>${this.t('taskmgr.btnStartService')}</button>
        <button class="win-btn" id="taskmgr-btn-stop-service" disabled>${this.t('taskmgr.btnStopService')}</button>
      </div>
    `;
  }

  renderServicesTableRows() {
    const tbody = this.contentEl ? this.contentEl.querySelector('#taskmgr-services-tbody') : null;
    if (!tbody) return;

    tbody.innerHTML = '';
    const btnStart = this.contentEl.querySelector('#taskmgr-btn-start-service');
    const btnStop = this.contentEl.querySelector('#taskmgr-btn-stop-service');

    let isSelectedFound = false;

    this.services.forEach(s => {
      const tr = document.createElement('tr');
      tr.className = 'taskmgr-row' + (this.selectedServiceId === s.id ? ' selected' : '');
      tr.dataset.id = s.id;

      if (this.selectedServiceId === s.id) isSelectedFound = true;

      const isRunning = s.status === 'Running';
      tr.innerHTML = `
        <td><b>${s.name}</b></td>
        <td>${s.display}</td>
        <td>${isRunning ? this.t('taskmgr.running') : this.t('taskmgr.stopped')}</td>
        <td>${s.startup}</td>
      `;

      tr.addEventListener('click', () => {
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedServiceId = s.id;
        btnStart.disabled = isRunning;
        btnStop.disabled = !isRunning;
      });

      tbody.appendChild(tr);
    });

    if (!isSelectedFound) {
      this.selectedServiceId = null;
      if (btnStart) btnStart.disabled = true;
      if (btnStop) btnStop.disabled = true;
    }
  }

  toggleService(serviceId, start) {
    const s = this.services.find(item => item.id === serviceId);
    if (!s) return;

    s.status = start ? 'Running' : 'Stopped';

    if (s.id === 'AudioSrv' && window.soundSys) window.soundSys.setMuted(!start, false);

    if (window.soundSys) window.soundSys.playClick();
    this.renderServicesTableRows();
  }
  renderStatusBarHtml() {
    return `
      <div class="taskmgr-statusbar">
        <div class="taskmgr-status-pane" id="taskmgr-status-procs">${this.t('taskmgr.statusProcesses', 0)}</div>
        <div class="taskmgr-status-pane" id="taskmgr-status-cpu">${this.t('taskmgr.statusCpu', 0)}</div>
        <div class="taskmgr-status-pane" id="taskmgr-status-mem">${this.t('taskmgr.statusMem', 0)}</div>
      </div>
    `;
  }

  updateStatusPane() {
    if (!this.contentEl) return;
    const procsEl = this.contentEl.querySelector('#taskmgr-status-procs');
    const cpuEl = this.contentEl.querySelector('#taskmgr-status-cpu');
    const memEl = this.contentEl.querySelector('#taskmgr-status-mem');

    const procs = this.getAllProcesses();
    if (procsEl) procsEl.textContent = this.t('taskmgr.statusProcesses', procs.length);
    if (cpuEl) cpuEl.textContent = this.t('taskmgr.statusCpu', this.currentCpu);
    if (memEl) {
      const memMB = Math.round(this.currentMem / 1024);
      memEl.textContent = this.t('taskmgr.statusMem', memMB);
    }
  }
  attachDomEvents() {
    if (!this.contentEl) return;
    this.contentEl.querySelectorAll('.taskmgr-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.renderFull();
      });
    });
    this.contentEl.querySelectorAll('.taskmgr-menu-item').forEach(menu => {
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasActive = menu.classList.contains('active');
        this.contentEl.querySelectorAll('.taskmgr-menu-item').forEach(m => m.classList.remove('active'));
        if (!wasActive) menu.classList.add('active');
      });
    });
    document.addEventListener('click', (e) => {
      if (this.contentEl && !e.target.closest('.taskmgr-menubar')) {
        this.contentEl.querySelectorAll('.taskmgr-menu-item').forEach(m => m.classList.remove('active'));
      }
    });
    this.contentEl.querySelectorAll('.taskmgr-menu-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.contentEl.querySelectorAll('.taskmgr-menu-item').forEach(m => m.classList.remove('active'));
        this.handleMenuAction(opt.dataset.action);
      });
    });
    const btnEndTask = this.contentEl.querySelector('#taskmgr-btn-end-task');
    if (btnEndTask) {
      btnEndTask.addEventListener('click', () => {
        if (this.selectedAppId) this.endAppTask(this.selectedAppId);
      });
    }

    const btnSwitchTo = this.contentEl.querySelector('#taskmgr-btn-switch-to');
    if (btnSwitchTo) {
      btnSwitchTo.addEventListener('click', () => {
        if (this.selectedAppId) this.switchToApp(this.selectedAppId);
      });
    }

    const btnNewTask = this.contentEl.querySelector('#taskmgr-btn-new-task');
    if (btnNewTask) {
      btnNewTask.addEventListener('click', () => {
        if (window.appDialogs) window.appDialogs.openRunDialog();
      });
    }
    const chkAllUsers = this.contentEl.querySelector('#taskmgr-chk-all-users');
    if (chkAllUsers) {
      chkAllUsers.addEventListener('change', (e) => {
        this.showAllUsers = e.target.checked;
        this.renderProcessTableRows();
      });
    }

    const btnEndProc = this.contentEl.querySelector('#taskmgr-btn-end-proc');
    if (btnEndProc) {
      btnEndProc.addEventListener('click', () => {
        if (this.selectedProcPid) {
          const procs = this.getAllProcesses();
          const p = procs.find(item => item.pid === this.selectedProcPid);
          if (p) this.terminateProcess(p);
        }
      });
    }
    this.contentEl.querySelectorAll('#taskmgr-procs-table .taskmgr-th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (this.sortColumn === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortColumn = col;
          this.sortAsc = true;
        }
        this.renderProcessTableRows();
      });
    });
    const btnStartSvc = this.contentEl.querySelector('#taskmgr-btn-start-service');
    if (btnStartSvc) {
      btnStartSvc.addEventListener('click', () => {
        if (this.selectedServiceId) this.toggleService(this.selectedServiceId, true);
      });
    }

    const btnStopSvc = this.contentEl.querySelector('#taskmgr-btn-stop-service');
    if (btnStopSvc) {
      btnStopSvc.addEventListener('click', () => {
        if (this.selectedServiceId) this.toggleService(this.selectedServiceId, false);
      });
    }
  }

  handleMenuAction(action) {
    switch (action) {
      case 'new-task':
        if (window.appDialogs) window.appDialogs.openRunDialog();
        break;
      case 'exit':
        if (window.winManager) window.winManager.closeWindow(this.winId);
        break;
      case 'always-on-top':
        this.alwaysOnTop = !this.alwaysOnTop;
        if (this.win && this.win.element) {
          this.win.element.style.zIndex = this.alwaysOnTop ? 99999 : '';
        }
        this.renderFull();
        break;
      case 'min-on-use':
        this.minimizeOnUse = !this.minimizeOnUse;
        this.renderFull();
        break;
      case 'hide-min':
        this.hideWhenMinimized = !this.hideWhenMinimized;
        this.renderFull();
        break;
      case 'refresh-now':
        this.updateMetrics();
        break;
      case 'speed-500':
        this.setUpdateSpeed(500);
        break;
      case 'speed-1000':
        this.setUpdateSpeed(1000);
        break;
      case 'speed-2000':
        this.setUpdateSpeed(2000);
        break;
      case 'speed-0':
        this.setUpdateSpeed(0);
        break;
      case 'toggle-kernel':
        this.showKernelTimes = !this.showKernelTimes;
        this.renderFull();
        break;
      case 'win-cascade':
        if (window.winManager) window.winManager.cascadeWindows();
        break;
      case 'win-tile-h':
        if (window.winManager) window.winManager.tileWindows(false);
        break;
      case 'win-tile-v':
        if (window.winManager) window.winManager.tileWindows(true);
        break;
      case 'win-minimize-all':
        if (window.winManager) window.winManager.minimizeAll();
        break;
      case 'help-topics':
        if (window.winManager) {
          window.winManager.openDialog({
            title: this.t('taskmgr.helpTopics'),
            icon: 'help',
            message: this.t('taskmgr.helpMessage')
          });
        }
        break;
      case 'about':
        if (window.winManager) {
          window.winManager.openDialog({
            title: this.t('taskmgr.aboutTitle'),
            icon: 'taskmgr',
            message: this.t('taskmgr.aboutText')
          });
        }
        break;
    }
  }
  ensureTrayIcon() {
    const trayEl = document.getElementById('taskbar-tray');
    const clockEl = document.getElementById('tray-clock');
    if (!trayEl || document.getElementById('tray-taskmgr')) return;

    const trayBtn = document.createElement('div');
    trayBtn.id = 'tray-taskmgr';
    trayBtn.className = 'tray-taskmgr-icon';
    trayBtn.title = `${this.t('taskmgr.statusCpu')}: ${this.currentCpu}%`;

    const canvas = document.createElement('canvas');
    canvas.className = 'tray-taskmgr-canvas';
    canvas.width = 14;
    canvas.height = 14;
    trayBtn.appendChild(canvas);

    trayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });

    if (clockEl) {
      trayEl.insertBefore(trayBtn, clockEl);
    } else {
      trayEl.appendChild(trayBtn);
    }

    this.trayCanvas = canvas;
    this.renderTrayCanvas();
  }

  removeTrayIcon() {
    const el = document.getElementById('tray-taskmgr');
    if (el) el.remove();
    this.trayCanvas = null;
  }

  renderTrayCanvas() {
    if (!this.trayCanvas) {
      const el = document.getElementById('tray-taskmgr');
      if (el) this.trayCanvas = el.querySelector('canvas');
    }
    if (!this.trayCanvas) return;

    const ctx = this.trayCanvas.getContext('2d');
    if (!ctx) return;

    const w = 14;
    const h = 14;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#004400';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    const fillH = Math.max(1, Math.round((this.currentCpu / 100) * (h - 2)));
    ctx.fillStyle = this.currentCpu > 85 ? '#ff0000' : (this.currentCpu > 60 ? '#ffff00' : '#00ff00');
    ctx.fillRect(2, h - 1 - fillH, w - 4, fillH);
    const trayBtn = document.getElementById('tray-taskmgr');
    if (trayBtn) {
      trayBtn.title = `${this.t('taskmgr.statusCpu')}: ${this.currentCpu}%`;
    }
  }
}
window.appTaskManager = new AppTaskManager();
