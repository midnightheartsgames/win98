class AppSysMon {
  constructor() {
    this.winId = 'win-sysmon';
    this.chartMode = 'line';
    this.intervalMs = 1000;
    this.sampleTimer = null;
    this.historyLength = 48;
    this.selectedSensorId = 'kernel_cpu';
    this.modalCategory = 'kernel';
    this.modalSensorId = 'kernel_threads';
    this.lastDialRecv = 0;
    this.lastDialSent = 0;

    this.categories = {
      kernel: 'Ядро (Kernel)',
      memory: 'Диспетчер памяти',
      dialup: 'Удаленный доступ',
      fs: 'Файловая система'
    };

    this.sensorCatalog = {
      kernel_cpu: {
        id: 'kernel_cpu',
        category: 'kernel',
        title: 'Ядро: Загрузка процессора (%)',
        unit: '%',
        color: '#00ff44',
        baseMax: 100,
        desc: 'Процент времени, в течение которого процессор Pentium II выполняет активные потоки Win 98 и DOS-задачи.'
      },
      kernel_threads: {
        id: 'kernel_threads',
        category: 'kernel',
        title: 'Ядро: Потоки (Threads)',
        unit: 'пот.',
        color: '#00ffff',
        baseMax: 64,
        desc: 'Общее количество активных потоков ядра VMM32 и открытых прикладных окон в системе.'
      },
      kernel_vms: {
        id: 'kernel_vms',
        category: 'kernel',
        title: 'Ядро: Виртуальные машины',
        unit: 'ВМ',
        color: '#ff9900',
        baseMax: 8,
        desc: 'Число активных виртуальных машин: Системная ВМ Win 32 плюс сеансы MS-DOS и QBasic.'
      },
      mem_alloc: {
        id: 'mem_alloc',
        category: 'memory',
        title: 'Память: Выделено памяти (МБ)',
        unit: 'МБ',
        color: '#ffff00',
        baseMax: 64,
        desc: 'Объем физической и страничной памяти, выделенной диспетчером памяти VMM32 для запущенных программ.'
      },
      mem_cache: {
        id: 'mem_cache',
        category: 'memory',
        title: 'Память: Дисковый кэш VCACHE (КБ)',
        unit: 'КБ',
        color: '#ff66ff',
        baseMax: 16384,
        desc: 'Текущий размер динамического дискового кэша VCACHE, ускоряющего чтение с дисков C: и D:.'
      },
      dial_rx: {
        id: 'dial_rx',
        category: 'dialup',
        title: 'Модем: Принято байт/с',
        unit: 'Б/с',
        color: '#33ccff',
        baseMax: 5600,
        desc: 'Скорость приема данных через контроллер удаленного доступа 56K V.90 и терминал HyperTerminal.'
      },
      dial_tx: {
        id: 'dial_tx',
        category: 'dialup',
        title: 'Модем: Передано байт/с',
        unit: 'Б/с',
        color: '#ff5555',
        baseMax: 2800,
        desc: 'Скорость отправки пакетов PPP/ZMODEM через модемное соединение.'
      },
      fs_io: {
        id: 'fs_io',
        category: 'fs',
        title: 'ФС: Чтение/запись диска (КБ/с)',
        unit: 'КБ/с',
        color: '#88ff00',
        baseMax: 2400,
        desc: 'Интенсивность обмена данными с файловой системой FAT32 (диск C:) и приводом CD-ROM (D:).'
      }
    };

    this.activeSensorIds = ['kernel_cpu', 'mem_alloc', 'dial_rx', 'fs_io'];
    this.series = {};
    this.initSeries();
  }

  initSeries() {
    for (const id of Object.keys(this.sensorCatalog)) {
      const meta = this.sensorCatalog[id];
      this.series[id] = {
        values: new Array(this.historyLength).fill(0),
        peak: 0,
        scaleMax: meta.baseMax
      };
    }
    for (let i = 0; i < 12; i++) {
      this.sampleAllSensors();
    }
  }

  computeLiveMetric(sensorId) {
    const winCount = (window.winManager && window.winManager.windows) ? window.winManager.windows.size : 1;
    const bios = (window.biosEngine && window.biosEngine.settings && window.biosEngine.settings.chipset) || {};
    const fsb = parseInt(bios.cpuHostClock || '100 MHz', 10) || 100;
    const mult = parseFloat(bios.cpuMultiplier || '4.5x') || 4.5;
    const cpuMhz = Math.max(200, Math.round(fsb * mult));

    const wintuneBusy = !!(window.appWintune && window.appWintune.running);
    const qbasicBusy = !!(window.appQBasic && window.appQBasic.running);
    const cdexBusy = !!(window.appCDex && window.appCDex.ripping);
    const cdPlayBusy = !!(window.appCDPlayer && window.appCDPlayer.state === 'playing');
    const hyperBusy = !!(window.appHyperTerminal && window.appHyperTerminal.connected);

    switch (sensorId) {
      case 'kernel_cpu': {
        let load = 6 + winCount * 5.5 + (Math.random() * 7);
        if (wintuneBusy) load += 65;
        if (qbasicBusy) load += 38;
        if (cdexBusy) load += 34;
        if (cdPlayBusy) load += 8;
        load *= (450 / cpuMhz);
        return Math.max(2, Math.min(100, Math.round(load)));
      }
      case 'kernel_threads': {
        const extra = (wintuneBusy ? 6 : 0) + (cdexBusy ? 4 : 0) + (hyperBusy ? 3 : 0);
        return 18 + winCount * 4 + extra;
      }
      case 'kernel_vms': {
        const hasDos = (window.winManager && window.winManager.windows && (
          window.winManager.windows.has('app_qbasic') ||
          window.winManager.windows.has('dos-prompt')
        )) ? 1 : 0;
        return 1 + hasDos + (qbasicBusy ? 1 : 0);
      }
      case 'mem_alloc': {
        const baseMb = 22.4 + winCount * 3.6 + (wintuneBusy ? 8.2 : 0) + (cdexBusy ? 4.1 : 0);
        return Number(Math.min(63.5, baseMb + (Math.random() * 0.8)).toFixed(1));
      }
      case 'mem_cache': {
        const cacheKb = 6400 + winCount * 680 + (cdexBusy ? 2800 : 0) + Math.round(Math.random() * 420);
        return Math.min(16384, cacheKb);
      }
      case 'dial_rx': {
        const dial = window.appDialUp;
        if (dial && !dial.isOnline && !hyperBusy) return 0;
        let rx = 420 + Math.round(Math.random() * 1450);
        if (dial && typeof dial.bytesRecv === 'number') {
          const delta = Math.max(0, dial.bytesRecv - this.lastDialRecv);
          this.lastDialRecv = dial.bytesRecv;
          if (delta > 0 && delta < 20000) rx = delta;
        }
        if (hyperBusy) rx += 1650;
        return Math.min(5600, rx);
      }
      case 'dial_tx': {
        const dial = window.appDialUp;
        if (dial && !dial.isOnline && !hyperBusy) return 0;
        let tx = 140 + Math.round(Math.random() * 520);
        if (dial && typeof dial.bytesSent === 'number') {
          const delta = Math.max(0, dial.bytesSent - this.lastDialSent);
          this.lastDialSent = dial.bytesSent;
          if (delta > 0 && delta < 12000) tx = delta;
        }
        if (hyperBusy) tx += 480;
        return Math.min(2800, tx);
      }
      case 'fs_io': {
        let io = 35 + winCount * 18 + Math.round(Math.random() * 95);
        if (cdexBusy) io += 1450;
        if (wintuneBusy) io += 980;
        if (cdPlayBusy) io += 176;
        return Math.min(2400, io);
      }
      default:
        return 0;
    }
  }

  sampleAllSensors() {
    for (const id of Object.keys(this.sensorCatalog)) {
      const val = this.computeLiveMetric(id);
      const st = this.series[id];
      const meta = this.sensorCatalog[id];
      st.values.push(val);
      if (st.values.length > this.historyLength) {
        st.values.shift();
      }
      if (val > st.peak) st.peak = val;
      st.scaleMax = Math.max(meta.baseMax, Math.ceil(st.peak * 1.15));
    }
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      this.renderGrid();
      return existing;
    }

    const content = `
      <div class="sysmon-shell" id="${this.winId}-shell">
        <div class="sysmon-menubar">
          <div class="sysmon-menu-item" data-menu="edit">
            <span><u>П</u>равка</span>
            <div class="sysmon-dropdown">
              <div class="sysmon-menu-opt" data-cmd="add-item"><span>Добавить показатель...</span></div>
              <div class="sysmon-menu-opt" data-cmd="remove-item"><span>Удалить выбранный показатель</span></div>
              <div class="sysmon-menu-sep"></div>
              <div class="sysmon-menu-opt" data-cmd="clear-charts"><span>Очистить графики</span></div>
            </div>
          </div>
          <div class="sysmon-menu-item" data-menu="view">
            <span><u>В</u>ид</span>
            <div class="sysmon-dropdown">
              <div class="sysmon-menu-opt checked" id="${this.winId}-m-line" data-cmd="mode-line"><span>Линейные графики</span></div>
              <div class="sysmon-menu-opt" id="${this.winId}-m-bar" data-cmd="mode-bar"><span>Гистограммы (с пиком)</span></div>
              <div class="sysmon-menu-opt" id="${this.winId}-m-num" data-cmd="mode-numeric"><span>Числовые индикаторы</span></div>
            </div>
          </div>
          <div class="sysmon-menu-item" data-menu="options">
            <span><u>П</u>араметры</span>
            <div class="sysmon-dropdown">
              <div class="sysmon-menu-opt" id="${this.winId}-m-fast" data-cmd="rate-500"><span>Интервал: Быстро (0.5 сек)</span></div>
              <div class="sysmon-menu-opt checked" id="${this.winId}-m-norm" data-cmd="rate-1000"><span>Интервал: Обычный (1.0 сек)</span></div>
              <div class="sysmon-menu-opt" id="${this.winId}-m-slow" data-cmd="rate-2000"><span>Интервал: Медленно (2.0 сек)</span></div>
            </div>
          </div>
          <div class="sysmon-menu-item" data-menu="help">
            <span><u>С</u>правка</span>
            <div class="sysmon-dropdown">
              <div class="sysmon-menu-opt" data-cmd="about"><span>О программе «Системный монитор»</span></div>
            </div>
          </div>
        </div>

        <div class="sysmon-toolbar">
          <button class="sysmon-tb-btn" data-cmd="add-item" title="Добавить показатель"><strong>+</strong> Добавить</button>
          <button class="sysmon-tb-btn" data-cmd="remove-item" title="Удалить выбранный показатель"><strong>−</strong> Удалить</button>
          <button class="sysmon-tb-btn" data-cmd="clear-charts" title="Сбросить историю и пики">Сброс</button>
          <div class="sysmon-tb-sep"></div>
          <button class="sysmon-tb-btn active" id="${this.winId}-tb-line" data-cmd="mode-line" title="Линейные графики">&#128200; Линии</button>
          <button class="sysmon-tb-btn" id="${this.winId}-tb-bar" data-cmd="mode-bar" title="Гистограммы">&#128202; Шкалы</button>
          <button class="sysmon-tb-btn" id="${this.winId}-tb-num" data-cmd="mode-numeric" title="Числовые индикаторы">123 Числа</button>
        </div>

        <div class="sysmon-grid" id="${this.winId}-grid"></div>

        <div class="sysmon-statusbar">
          <div class="sysmon-status-cell" id="${this.winId}-st-left">Ядро: Загрузка процессора (%)</div>
          <div class="sysmon-status-cell" id="${this.winId}-st-right">Последнее: 0 | Пик: 0</div>
        </div>

        <div class="sysmon-modal-backdrop" id="${this.winId}-add-modal">
          <div class="sysmon-modal">
            <div class="sysmon-modal-titlebar">
              <span>Добавление показателя</span>
              <button class="win-btn" id="${this.winId}-modal-close" style="min-width:16px;height:14px;padding:0;line-height:10px;">×</button>
            </div>
            <div class="sysmon-modal-body">
              <div class="sysmon-add-cols">
                <div>
                  <div style="margin-bottom:3px;">Категория:</div>
                  <div class="sysmon-list-box" id="${this.winId}-cat-list"></div>
                </div>
                <div>
                  <div style="margin-bottom:3px;">Показатель:</div>
                  <div class="sysmon-list-box" id="${this.winId}-item-list"></div>
                </div>
              </div>
              <div class="sysmon-explain-box" id="${this.winId}-item-explain"></div>
              <div class="sysmon-modal-footer">
                <button class="win-btn default" id="${this.winId}-modal-ok">Добавить</button>
                <button class="win-btn" id="${this.winId}-modal-cancel">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'Системный монитор',
      icon: 'sysmon',
      width: 560,
      height: 410,
      minWidth: 440,
      minHeight: 310,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents();
    this.renderGrid();
    this.startSampling();
    return win;
  }

  bindEvents() {
    const shell = document.getElementById(`${this.winId}-shell`);
    if (!shell) return;

    const menuItems = shell.querySelectorAll('.sysmon-menu-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.sysmon-menu-opt')) return;
        const wasOpen = item.classList.contains('open');
        menuItems.forEach((m) => m.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    shell.addEventListener('click', (e) => {
      if (!e.target.closest('.sysmon-menu-item')) {
        menuItems.forEach((m) => m.classList.remove('open'));
      }
      const cmdNode = e.target.closest('[data-cmd]');
      if (cmdNode) {
        menuItems.forEach((m) => m.classList.remove('open'));
        this.handleCommand(cmdNode.dataset.cmd);
      }
    });

    const onClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    onClick(`${this.winId}-modal-close`, () => this.closeAddModal());
    onClick(`${this.winId}-modal-cancel`, () => this.closeAddModal());
    onClick(`${this.winId}-modal-ok`, () => this.confirmAddSensor());
  }

  handleCommand(cmd) {
    switch (cmd) {
      case 'add-item':
        this.openAddModal();
        break;
      case 'remove-item':
        this.removeSelectedSensor();
        break;
      case 'clear-charts':
        this.clearAllHistory();
        break;
      case 'mode-line':
        this.setChartMode('line');
        break;
      case 'mode-bar':
        this.setChartMode('bar');
        break;
      case 'mode-numeric':
        this.setChartMode('numeric');
        break;
      case 'rate-500':
        this.setSampleRate(500);
        break;
      case 'rate-1000':
        this.setSampleRate(1000);
        break;
      case 'rate-2000':
        this.setSampleRate(2000);
        break;
      case 'about':
        if (window.winManager && typeof window.winManager.openDialog === 'function') {
          window.winManager.openDialog({
            title: 'О программе «Системный монитор»',
            icon: 'sysmon',
            message: 'Системный монитор Microslop Win 98 SE (SYSMON.EXE v4.10.1998)\nНаблюдение за ядром VMM32, памятью VCACHE, модемом и дисковой подсистемой в реальном времени.'
          });
        }
        break;
    }
  }

  setChartMode(mode) {
    this.chartMode = mode;
    const sync = (id, cond) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('checked', cond);
        el.classList.toggle('active', cond);
      }
    };
    sync(`${this.winId}-m-line`, mode === 'line');
    sync(`${this.winId}-m-bar`, mode === 'bar');
    sync(`${this.winId}-m-num`, mode === 'numeric');
    sync(`${this.winId}-tb-line`, mode === 'line');
    sync(`${this.winId}-tb-bar`, mode === 'bar');
    sync(`${this.winId}-tb-num`, mode === 'numeric');
    this.renderGrid();
  }

  setSampleRate(ms) {
    this.intervalMs = ms;
    const sync = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('checked', cond);
    };
    sync(`${this.winId}-m-fast`, ms === 500);
    sync(`${this.winId}-m-norm`, ms === 1000);
    sync(`${this.winId}-m-slow`, ms === 2000);
    this.startSampling();
  }

  addSensor(sensorId) {
    if (!this.sensorCatalog[sensorId]) return false;
    if (!this.activeSensorIds.includes(sensorId)) {
      this.activeSensorIds.push(sensorId);
    }
    this.selectedSensorId = sensorId;
    this.renderGrid();
    return true;
  }

  removeSelectedSensor() {
    if (this.activeSensorIds.length <= 1) return false;
    const idx = this.activeSensorIds.indexOf(this.selectedSensorId);
    if (idx !== -1) {
      this.activeSensorIds.splice(idx, 1);
      this.selectedSensorId = this.activeSensorIds[Math.max(0, idx - 1)];
      this.renderGrid();
      return true;
    }
    return false;
  }

  clearAllHistory() {
    for (const id of Object.keys(this.series)) {
      this.series[id].values = new Array(this.historyLength).fill(0);
      this.series[id].peak = 0;
    }
    this.sampleAllSensors();
    this.drawActiveCharts();
  }

  renderGrid() {
    const grid = document.getElementById(`${this.winId}-grid`);
    if (!grid) return;

    grid.innerHTML = this.activeSensorIds.map((id) => {
      const meta = this.sensorCatalog[id];
      const isSel = id === this.selectedSensorId;
      return `
        <div class="sysmon-card ${isSel ? 'selected' : ''}" data-sensor-id="${id}">
          <div class="sysmon-card-hdr">
            <div class="sysmon-card-title">
              <span class="sysmon-color-dot" style="background:${meta.color};"></span>
              <span>${meta.title}</span>
            </div>
            <span id="${this.winId}-val-${id}">0 ${meta.unit}</span>
          </div>
          <div class="sysmon-card-body" id="${this.winId}-body-${id}">
            ${this.chartMode === 'numeric'
              ? `<div class="sysmon-numeric-box">
                   <div class="sysmon-num-big" id="${this.winId}-num-cur-${id}" style="color:${meta.color};">0</div>
                   <div class="sysmon-num-sub">
                     <span id="${this.winId}-num-avg-${id}">Средн: 0</span>
                     <span id="${this.winId}-num-peak-${id}">Пик: 0</span>
                   </div>
                 </div>`
              : `<canvas class="sysmon-canvas" id="${this.winId}-cv-${id}" width="240" height="96"></canvas>`
            }
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.sysmon-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.selectedSensorId = card.dataset.sensorId;
        grid.querySelectorAll('.sysmon-card').forEach((c) => {
          c.classList.toggle('selected', c.dataset.sensorId === this.selectedSensorId);
        });
        this.updateStatusBar();
      });
    });

    this.drawActiveCharts();
  }

  drawActiveCharts() {
    for (const id of this.activeSensorIds) {
      const meta = this.sensorCatalog[id];
      const st = this.series[id];
      const latest = st.values[st.values.length - 1] || 0;
      const valBadge = document.getElementById(`${this.winId}-val-${id}`);
      if (valBadge) {
        valBadge.textContent = `${latest} ${meta.unit}`;
      }

      if (this.chartMode === 'numeric') {
        const curEl = document.getElementById(`${this.winId}-num-cur-${id}`);
        const avgEl = document.getElementById(`${this.winId}-num-avg-${id}`);
        const peakEl = document.getElementById(`${this.winId}-num-peak-${id}`);
        const nonZero = st.values.filter((v) => v > 0);
        const avg = nonZero.length
          ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 10) / 10
          : latest;
        if (curEl) curEl.textContent = `${latest} ${meta.unit}`;
        if (avgEl) avgEl.textContent = `Средн: ${avg}`;
        if (peakEl) peakEl.textContent = `Пик: ${st.peak}`;
        continue;
      }

      const canvas = document.getElementById(`${this.winId}-cv-${id}`);
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');
      const w = canvas.width || 240;
      const h = canvas.height || 96;

      ctx.fillStyle = '#001c00';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#004200';
      ctx.lineWidth = 1;
      for (let y = 16; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 24; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const maxVal = Math.max(1, st.scaleMax);

      if (this.chartMode === 'line') {
        ctx.strokeStyle = meta.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const stepX = w / (this.historyLength - 1);
        st.values.forEach((v, idx) => {
          const x = idx * stepX;
          const y = h - 4 - Math.min(1, v / maxVal) * (h - 10);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (this.chartMode === 'bar') {
        const barPad = 24;
        const maxBarW = w - barPad * 2;
        const curW = Math.round(Math.min(1, latest / maxVal) * maxBarW);
        const peakX = barPad + Math.round(Math.min(1, st.peak / maxVal) * maxBarW);

        ctx.fillStyle = '#003000';
        ctx.fillRect(barPad, 28, maxBarW, 36);

        ctx.fillStyle = meta.color;
        ctx.fillRect(barPad, 28, curW, 36);

        ctx.strokeStyle = '#ff2222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(peakX, 22);
        ctx.lineTo(peakX, 70);
        ctx.stroke();

        ctx.fillStyle = '#b8ffb8';
        ctx.font = '10px Tahoma, sans-serif';
        ctx.fillText(`0`, barPad, 84);
        ctx.fillText(`Пик: ${st.peak} ${meta.unit}`, barPad + 45, 84);
      }

      ctx.fillStyle = '#90e090';
      ctx.font = '9px monospace';
      ctx.fillText(String(maxVal), 3, 10);
    }

    this.updateStatusBar();
  }

  updateStatusBar() {
    const meta = this.sensorCatalog[this.selectedSensorId] || this.sensorCatalog.kernel_cpu;
    const st = this.series[meta.id];
    const latest = st ? st.values[st.values.length - 1] : 0;
    const peak = st ? st.peak : 0;

    const stLeft = document.getElementById(`${this.winId}-st-left`);
    const stRight = document.getElementById(`${this.winId}-st-right`);
    if (stLeft) stLeft.textContent = meta.title;
    if (stRight) stRight.textContent = `Посл: ${latest} ${meta.unit} | Пик: ${peak}`;
  }

  openAddModal() {
    const modal = document.getElementById(`${this.winId}-add-modal`);
    if (!modal) return;
    this.renderAddModalLists();
    modal.classList.add('open');
  }

  renderAddModalLists() {
    const catBox = document.getElementById(`${this.winId}-cat-list`);
    const itemBox = document.getElementById(`${this.winId}-item-list`);
    const expBox = document.getElementById(`${this.winId}-item-explain`);

    if (catBox) {
      catBox.innerHTML = Object.entries(this.categories).map(([catKey, label]) => (
        `<div class="sysmon-list-item ${catKey === this.modalCategory ? 'selected' : ''}" data-cat="${catKey}">${label}</div>`
      )).join('');
      catBox.querySelectorAll('.sysmon-list-item').forEach((el) => {
        el.addEventListener('click', () => {
          this.modalCategory = el.dataset.cat;
          const firstInCat = Object.values(this.sensorCatalog).find((s) => s.category === this.modalCategory);
          if (firstInCat) this.modalSensorId = firstInCat.id;
          this.renderAddModalLists();
        });
      });
    }

    const items = Object.values(this.sensorCatalog).filter((s) => s.category === this.modalCategory);
    if (!items.some((s) => s.id === this.modalSensorId) && items.length) {
      this.modalSensorId = items[0].id;
    }

    if (itemBox) {
      itemBox.innerHTML = items.map((s) => {
        const addedTag = this.activeSensorIds.includes(s.id) ? ' [активен]' : '';
        return `<div class="sysmon-list-item ${s.id === this.modalSensorId ? 'selected' : ''}" data-sensor="${s.id}">${s.title}${addedTag}</div>`;
      }).join('');
      itemBox.querySelectorAll('.sysmon-list-item').forEach((el) => {
        el.addEventListener('click', () => {
          this.modalSensorId = el.dataset.sensor;
          this.renderAddModalLists();
        });
      });
    }

    const chosen = this.sensorCatalog[this.modalSensorId];
    if (expBox && chosen) {
      expBox.textContent = chosen.desc;
    }
  }

  confirmAddSensor() {
    if (this.modalSensorId) {
      this.addSensor(this.modalSensorId);
    }
    this.closeAddModal();
  }

  closeAddModal() {
    const modal = document.getElementById(`${this.winId}-add-modal`);
    if (modal) modal.classList.remove('open');
  }

  startSampling() {
    this.stopSampling();
    this.sampleTimer = setInterval(() => {
      this.sampleAllSensors();
      this.drawActiveCharts();
    }, this.intervalMs);
  }

  stopSampling() {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
  }

  cleanup() {
    this.stopSampling();
  }
}

window.appSysMon = new AppSysMon();
