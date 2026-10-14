class AppDefrag {
  constructor() {
    this.cols = 58;
    this.rows = 20;
    this.totalClusters = this.cols * this.rows;
    this.clusters = [];
    this.isRunning = false;
    this.isPaused = false;
    this.timer = null;
    this.progress = 0;
    this.details = false;
    this.win = null;
    this.colors = {
      sys: '#ff0000',
      used: '#000080',
      frag: '#00ffff',
      free: '#ffffff',
      read: '#00ff00',
      write: '#ff00ff'
    };
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  open() {
    if (window.winManager.windows.has('app_defrag')) {
      window.winManager.createWindow({ id: 'app_defrag' });
      return;
    }
    if (window.winManager.windows.has('app_defrag_select')) {
      window.winManager.createWindow({ id: 'app_defrag_select' });
      return;
    }
    const t = (k, ...a) => this.t(k, ...a);
    const dlg = window.winManager.createWindow({
      id: 'app_defrag_select',
      title: t('defrag.selectTitle'),
      icon: 'defrag',
      width: 330,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="defrag-select">
          <div class="defrag-select-main">
            <div class="defrag-select-icon">${Icons['defrag']}</div>
            <div class="defrag-select-body">
              <p>${t('defrag.selectPrompt')}</p>
              <select class="win-select defrag-drive">
                <option value="C">${t('defrag.driveC')}</option>
                <option value="all">${t('defrag.allDrives')}</option>
              </select>
              <p class="defrag-select-note">${t('defrag.selectNote')}</p>
            </div>
          </div>
          <div class="defrag-select-buttons">
            <button class="win-btn is-default defrag-ok">${t('btn.ok')}</button>
            <button class="win-btn defrag-exit">${t('defrag.exit')}</button>
          </div>
        </div>`
    });
    dlg.element.querySelector('.defrag-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_defrag_select');
      this.openMain();
    });
    dlg.element.querySelector('.defrag-exit').addEventListener('click', () => window.winManager.closeWindow('app_defrag_select'));
  }

  openMain() {
    const t = (k, ...a) => this.t(k, ...a);
    this.details = false;
    this.initClusters();
    const content = document.createElement('div');
    content.className = 'defrag-window';
    content.innerHTML = `
      <div class="defrag-map-wrap hidden"><canvas class="defrag-map"></canvas></div>
      <div class="defrag-panel">
        <div class="defrag-info">
          <div class="defrag-label">${t('defrag.header')}</div>
          <div class="defrag-progress"><div class="defrag-progress-fill"></div></div>
          <div class="defrag-pct">${t('defrag.completed', 0)}</div>
        </div>
        <div class="defrag-buttons">
          <button class="win-btn defrag-stop">${t('defrag.stop')}</button>
          <button class="win-btn defrag-pause">${t('defrag.pause')}</button>
          <button class="win-btn defrag-legend hidden">${t('defrag.legend')}</button>
          <button class="win-btn defrag-details">${t('defrag.showDetails')}</button>
        </div>
      </div>
      <div class="win-statusbar defrag-status hidden"><div class="win-status-pane grow defrag-status-text"></div></div>
    `;
    this.win = window.winManager.createWindow({
      id: 'app_defrag',
      title: t('defrag.title'),
      icon: 'defrag',
      width: 380,
      height: 'auto',
      resizable: false,
      content
    });
    this.el = content;
    content.querySelector('.defrag-stop').addEventListener('click', () => this.confirmStop());
    content.querySelector('.defrag-pause').addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      content.querySelector('.defrag-pause').textContent = t(this.isPaused ? 'defrag.resume' : 'defrag.pause');
      this.updateStatus();
    });
    content.querySelector('.defrag-details').addEventListener('click', () => this.toggleDetails());
    content.querySelector('.defrag-legend').addEventListener('click', () => this.showLegend());
    this.win.onClose = () => {
      this.stop();
      this.win = null;
    };
    this.start();
  }

  initClusters() {
    this.clusters = [];
    for (let i = 0; i < this.totalClusters; i++) {
      let type = 'free';
      const r = Math.random();
      if (i < 40) type = 'sys';
      else if (i < this.totalClusters * 0.35) type = r < 0.2 ? 'frag' : r < 0.3 ? 'free' : 'used';
      else if (i < this.totalClusters * 0.75) type = r < 0.4 ? 'frag' : r < 0.65 ? 'used' : 'free';
      else type = r < 0.12 ? 'frag' : 'free';
      this.clusters.push(type);
    }
    this.initialFrags = this.clusters.filter(c => c === 'frag').length || 1;
  }

  toggleDetails() {
    const t = (k, ...a) => this.t(k, ...a);
    this.details = !this.details;
    const el = this.el;
    el.querySelector('.defrag-map-wrap').classList.toggle('hidden', !this.details);
    el.querySelector('.defrag-status').classList.toggle('hidden', !this.details);
    el.querySelector('.defrag-legend').classList.toggle('hidden', !this.details);
    el.querySelector('.defrag-info').classList.toggle('hidden', this.details);
    el.querySelector('.defrag-details').textContent = t(this.details ? 'defrag.hideDetails' : 'defrag.showDetails');
    el.classList.toggle('details', this.details);
    this.win.element.style.width = this.details ? (this.cols * 8 + 26) + 'px' : '380px';
    this.win.element.style.height = 'auto';
    this.drawMap();
    this.updateStatus();
  }

  drawMap() {
    if (!this.details || !this.el) return;
    const canvas = this.el.querySelector('.defrag-map');
    const cw = 8;
    const ch = 9;
    canvas.width = this.cols * cw;
    canvas.height = this.rows * ch;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.clusters.forEach((type, i) => this.drawCell(ctx, i, type, cw, ch));
  }

  drawCell(ctx, i, type, cw = 8, ch = 9) {
    const x = (i % this.cols) * cw;
    const y = Math.floor(i / this.cols) * ch;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = this.colors[type] || '#ffffff';
    ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    ctx.fillStyle = type === 'free' ? '#c0c0c0' : '#000000';
    ctx.fillRect(x + cw - 1, y + 1, 1, ch - 1);
    ctx.fillRect(x + 1, y + ch - 1, cw - 1, 1);
    if (type !== 'free') {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 1, y + 1, cw - 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, ch - 2);
    }
  }

  updateCell(idx, state) {
    if (!this.details || !this.el) return;
    const ctx = this.el.querySelector('.defrag-map').getContext('2d');
    this.drawCell(ctx, idx, state);
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.readIdx = this.totalClusters - 1;
    this.writeIdx = 40;
    this.progress = 0;
    this.busy = false;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isPaused && !this.busy) this.step();
    }, 40);
    this.updateProgressUI();
  }

  step() {
    if (!this.win) {
      this.stop();
      return;
    }
    while (this.readIdx > 0 && this.clusters[this.readIdx] !== 'frag') this.readIdx--;
    while (this.writeIdx < this.totalClusters && this.clusters[this.writeIdx] !== 'free' && this.clusters[this.writeIdx] !== 'frag') this.writeIdx++;
    if (this.readIdx <= this.writeIdx) {
      this.finish();
      return;
    }
    if (this.clusters[this.writeIdx] === 'frag') {
      this.clusters[this.writeIdx] = 'used';
      this.updateCell(this.writeIdx, 'used');
      this.writeIdx++;
      return;
    }
    this.busy = true;
    const from = this.readIdx;
    const to = this.writeIdx;
    this.updateCell(from, 'read');
    if (window.soundSys && window.soundSys.playDefragTick && Math.random() < 0.4) window.soundSys.playDefragTick();
    setTimeout(() => {
      if (!this.isRunning) return;
      this.updateCell(to, 'write');
      setTimeout(() => {
        if (!this.isRunning) return;
        this.clusters[from] = 'free';
        this.clusters[to] = 'used';
        this.updateCell(from, 'free');
        this.updateCell(to, 'used');
        this.readIdx--;
        this.writeIdx++;
        const left = this.clusters.filter(c => c === 'frag').length;
        this.progress = Math.min(99, Math.round(100 - (left / this.initialFrags) * 100));
        this.updateProgressUI();
        this.busy = false;
      }, 30);
    }, 30);
  }

  updateProgressUI() {
    if (!this.el) return;
    const pct = Math.max(0, this.progress);
    this.el.querySelector('.defrag-pct').textContent = this.t('defrag.completed', pct);
    const fill = this.el.querySelector('.defrag-progress-fill');
    fill.style.width = `${Math.floor(pct / 100 * 40) * 2.5}%`;
    this.updateStatus();
  }

  updateStatus() {
    if (!this.el) return;
    const text = this.isPaused ? this.t('defrag.paused') : this.t('defrag.statusRunning', Math.max(0, this.progress));
    this.el.querySelector('.defrag-status-text').textContent = text;
  }

  confirmStop() {
    const wasPaused = this.isPaused;
    this.isPaused = true;
    window.winManager.openDialog({
      title: this.t('defrag.selectTitle'),
      icon: 'question',
      message: this.t('defrag.confirmStop'),
      buttons: [
        { text: this.t('defrag.resume'), primary: true, onClick: () => { this.isPaused = wasPaused; } },
        { text: this.t('defrag.selectDrive'), onClick: () => { this.stop(); window.winManager.closeWindow('app_defrag'); this.open(); } },
        { text: this.t('defrag.exit'), onClick: () => { this.stop(); window.winManager.closeWindow('app_defrag'); } }
      ]
    });
  }

  finish() {
    this.stop();
    this.progress = 100;
    this.clusters.forEach((c, idx) => {
      if (c === 'frag') {
        this.clusters[idx] = 'used';
        this.updateCell(idx, 'used');
      }
    });
    this.updateProgressUI();
    if (window.soundSys && window.soundSys.playInformation) window.soundSys.playInformation();
    window.winManager.openDialog({
      title: this.t('defrag.selectTitle'),
      icon: 'defrag',
      message: this.t('defrag.doneMsg'),
      buttons: [
        { text: 'Yes', primary: true, onClick: () => window.winManager.closeWindow('app_defrag') },
        { text: 'No' }
      ]
    });
  }

  showLegend() {
    const id = 'app_defrag_legend';
    if (window.winManager.windows.has(id)) return;
    const t = (k, ...a) => this.t(k, ...a);
    const row = (type, key) => `<div class="defrag-legend-row"><canvas width="8" height="9" data-type="${type}"></canvas><span>${t(key)}</span></div>`;
    const dlg = window.winManager.createWindow({
      id,
      title: t('defrag.legendTitle'),
      icon: 'defrag',
      width: 380,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="defrag-legend-dlg">
          ${row('frag', 'defrag.lgFrag')}
          ${row('used', 'defrag.lgUsed')}
          ${row('sys', 'defrag.lgSys')}
          ${row('read', 'defrag.lgRead')}
          ${row('write', 'defrag.lgWrite')}
          ${row('free', 'defrag.lgFree')}
          <p>${t('defrag.lgCluster')}</p>
          <div class="defrag-legend-buttons"><button class="win-btn is-default defrag-legend-close">${t('defrag.close')}</button></div>
        </div>`
    });
    dlg.element.querySelectorAll('canvas[data-type]').forEach(c => this.drawCell(c.getContext('2d'), 0, c.dataset.type));
    dlg.element.querySelector('.defrag-legend-close').addEventListener('click', () => window.winManager.closeWindow(id));
  }

  stop() {
    this.isRunning = false;
    this.busy = false;
    clearInterval(this.timer);
  }
}

window.appDefrag = new AppDefrag();
