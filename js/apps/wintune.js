class AppWintune {
  constructor() {
    this.winId = 'win-wintune';
    this.variant = 'wintune';
    this.activeMetric = 'cpuInt';
    this.running = false;
    this.animFrame = null;
    this.stageTimer = null;
    this.userScores = null;

    this.referenceRigs = [
      {
        name: 'Intel Pentium 200 MMX (66×3.0, S3 Virge)',
        cpuInt: 410,
        cpuFpu: 205,
        video2d: 58,
        video3d: 28,
        diskIo: 6.4
      },
      {
        name: 'AMD K6-2 300 3DNow! (100×3.0, Riva 128)',
        cpuInt: 685,
        cpuFpu: 310,
        video2d: 112,
        video3d: 84,
        diskIo: 11.2
      },
      {
        name: 'Celeron 300A @ 450 МГц (100×4.5, Voodoo2)',
        cpuInt: 1140,
        cpuFpu: 575,
        video2d: 168,
        video3d: 185,
        diskIo: 17.5
      },
      {
        name: 'Intel Pentium II 450 (Эталон 440BX + Voodoo2)',
        cpuInt: 1220,
        cpuFpu: 625,
        video2d: 184,
        video3d: 210,
        diskIo: 21.8
      },
      {
        name: 'Intel Pentium III 600 (Katmai + GeForce 256)',
        cpuInt: 1690,
        cpuFpu: 880,
        video2d: 245,
        video3d: 310,
        diskIo: 27.4
      }
    ];

    this.metricsMeta = {
      cpuInt: { label: 'CPU Dhrystone', unit: 'MIPS' },
      cpuFpu: { label: 'FPU / MMX Whetstone', unit: 'MFLOPS' },
      video2d: { label: '2D Video GDI', unit: 'MPix/s' },
      video3d: { label: '3D Direct3D / Glide', unit: 'FPS' },
      diskIo: { label: 'Cached Disk I/O', unit: 'MB/s' }
    };
  }

  readHardwareTelemetry() {
    const bios = (window.biosEngine && window.biosEngine.settings) ? window.biosEngine.settings : null;
    const chipset = (bios && bios.chipset) || {};
    const features = (bios && bios.features) || {};
    const periph = (bios && bios.peripherals) || {};

    const fsb = parseInt(chipset.cpuHostClock || '100 MHz', 10) || 100;
    const mult = parseFloat(chipset.cpuMultiplier || '4.5x') || 4.5;
    const mhz = Math.round(fsb * mult);
    const l1 = features.cpuInternalCache !== 'Disabled';
    const l2 = features.externalCache !== 'Disabled';
    const cas2 = String(chipset.sdramCasLatency || '2') === '2';
    const agp2x = chipset.agp2xMode !== 'Disabled';
    const udma = periph.idePriMasterUdma !== 'Disabled';
    const aperture = chipset.agpApertureSize || '64MB';

    const cacheFactor = (l1 ? 1.0 : 0.18) * (l2 ? 1.0 : 0.68);
    const ramFactor = cas2 ? 1.06 : 0.94;
    const fsbBonus = 1 + (fsb - 100) * 0.0045;

    const cpuInt = Math.max(45, Math.round(mhz * 2.58 * cacheFactor * ramFactor * fsbBonus));
    const cpuFpu = Math.max(25, Math.round(mhz * 1.32 * cacheFactor * ramFactor * fsbBonus));
    const video2d = Math.max(20, Math.round((130 + mhz * 0.11) * (agp2x ? 1.08 : 0.82) * ramFactor * (l1 ? 1.0 : 0.45)));
    const video3d = Math.max(15, Math.round((145 + mhz * 0.14) * (agp2x ? 1.12 : 0.78) * (l1 ? 1.0 : 0.5)));
    const diskIo = Number(Math.max(3.2, (udma ? 21.4 : 8.6) * (l2 ? 1.04 : 0.78) * (fsb >= 100 ? 1.02 : 0.92)).toFixed(1));

    return {
      fsb,
      mult,
      mhz,
      l1,
      l2,
      cas2,
      agp2x,
      udma,
      aperture,
      scores: { cpuInt, cpuFpu, video2d, video3d, diskIo }
    };
  }

  open(variant = 'wintune') {
    this.variant = variant === 'clibench' ? 'clibench' : 'wintune';
    const title = this.variant === 'clibench'
      ? 'CliBench MK II v0.7.95 (SMP / FPU Benchmark)'
      : 'Wintune 97 Hardware Benchmark for Win 98';

    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      window.winManager.setTitle(this.winId, title);
      this.refreshAll();
      return existing;
    }

    const content = `
      <div class="wt-shell" id="${this.winId}-shell">
        <div class="wt-banner ${this.variant === 'clibench' ? 'clibench' : ''}" id="${this.winId}-banner">
          <div class="wt-banner-left">
            <div class="wt-logo-box" id="${this.winId}-logo">${this.variant === 'clibench' ? 'CLIBENCH' : 'WINTUNE 97'}</div>
            <div class="wt-banner-titles">
              <span class="wt-banner-main" id="${this.winId}-hdr-title">${title}</span>
              <span class="wt-banner-sub" id="${this.winId}-hdr-sub">Microslop Win 98 SE • DirectX 6.0 • 3dfx Glide / Intel 440BX</span>
            </div>
          </div>
          <div class="wt-banner-actions">
            <button class="win-btn" id="${this.winId}-switch-mode" style="min-width:0; padding:2px 8px;">Режим: ${this.variant === 'clibench' ? 'Wintune 97' : 'CliBench'}</button>
            <button class="win-btn default" id="${this.winId}-run-all" style="font-weight:bold;">&#9654; Тест системы</button>
          </div>
        </div>

        <div class="wt-top-grid">
          <div class="wt-hw-card">
            <div class="wt-hw-title">
              <span>Конфигурация оборудования (CMOS / SMBIOS)</span>
              <span id="${this.winId}-clock-badge">450 МГц</span>
            </div>
            <table class="wt-spec-table" id="${this.winId}-spec-table"></table>
            <div class="wt-test-buttons">
              <button class="win-btn" data-wt-stage="cpu" style="min-width:0; padding:2px 7px;">Тест CPU/FPU</button>
              <button class="win-btn" data-wt-stage="2d" style="min-width:0; padding:2px 7px;">Тест 2D GDI</button>
              <button class="win-btn" data-wt-stage="3d" style="min-width:0; padding:2px 7px;">Тест 3D Torus</button>
              <button class="win-btn" data-wt-stage="disk" style="min-width:0; padding:2px 7px;">Тест Диска</button>
            </div>
          </div>

          <div class="wt-viewport-box">
            <canvas class="wt-canvas" id="${this.winId}-canvas" width="244" height="154"></canvas>
            <div class="wt-viewport-caption">
              <span id="${this.winId}-vp-stage">СТЕНД ГОТОВ</span>
              <span id="${this.winId}-vp-fps">IDLE</span>
            </div>
          </div>
        </div>

        <div class="wt-results-box">
          <div class="wt-metric-tabs" id="${this.winId}-tabs">
            ${Object.entries(this.metricsMeta).map(([key, meta]) => `
              <button class="wt-metric-tab ${key === this.activeMetric ? 'active' : ''}" data-metric="${key}">
                ${meta.label} (${meta.unit})
              </button>
            `).join('')}
          </div>
          <div class="wt-bars-list" id="${this.winId}-bars"></div>
        </div>

        <div class="wt-advisor" id="${this.winId}-advisor">
          <span id="${this.winId}-advisor-text">Нажмите «Тест системы» для замера производительности вашего ПК.</span>
          <button class="win-btn" id="${this.winId}-boost-btn" style="min-width:0; padding:2px 8px;">Разгон FSB 112 МГц</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title,
      icon: 'wintune',
      width: 670,
      height: 465,
      minWidth: 580,
      minHeight: 410,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    const hw = this.readHardwareTelemetry();
    this.userScores = hw.scores;

    this.bindEvents();
    this.refreshAll();
    this.drawIdleViewport();
    return win;
  }

  bindEvents() {
    document.getElementById(`${this.winId}-run-all`).addEventListener('click', () => {
      this.runFullBenchmark();
    });

    document.getElementById(`${this.winId}-switch-mode`).addEventListener('click', () => {
      this.variant = this.variant === 'wintune' ? 'clibench' : 'wintune';
      this.refreshAll();
    });

    document.querySelectorAll(`#${this.winId} [data-wt-stage]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        this.runSingleStage(btn.dataset.wtStage);
      });
    });

    document.getElementById(`${this.winId}-tabs`).addEventListener('click', (e) => {
      const tab = e.target.closest('.wt-metric-tab');
      if (!tab) return;
      this.activeMetric = tab.dataset.metric;
      this.refreshAll();
    });

    document.getElementById(`${this.winId}-boost-btn`).addEventListener('click', () => {
      if (window.biosEngine && window.biosEngine.settings) {
        const s = window.biosEngine.settings;
        s.chipset.cpuHostClock = '112 MHz';
        s.chipset.sdramCasLatency = '2';
        s.chipset.agp2xMode = 'Enabled';
        s.features.cpuInternalCache = 'Enabled';
        s.features.externalCache = 'Enabled';
        s.peripherals.idePriMasterUdma = 'Auto';
        if (typeof window.biosEngine.saveSettings === 'function') {
          window.biosEngine.saveSettings();
        }
      }
      this.runFullBenchmark();
    });
  }

  refreshAll() {
    const hw = this.readHardwareTelemetry();
    this.userScores = hw.scores;

    const banner = document.getElementById(`${this.winId}-banner`);
    const logo = document.getElementById(`${this.winId}-logo`);
    const hdrTitle = document.getElementById(`${this.winId}-hdr-title`);
    const switchBtn = document.getElementById(`${this.winId}-switch-mode`);
    const title = this.variant === 'clibench'
      ? 'CliBench MK II v0.7.95 (SMP / FPU Benchmark)'
      : 'Wintune 97 Hardware Benchmark for Win 98';

    if (banner) banner.classList.toggle('clibench', this.variant === 'clibench');
    if (logo) logo.textContent = this.variant === 'clibench' ? 'CLIBENCH' : 'WINTUNE 97';
    if (hdrTitle) hdrTitle.textContent = title;
    if (switchBtn) switchBtn.textContent = `Режим: ${this.variant === 'clibench' ? 'Wintune 97' : 'CliBench'}`;
    if (window.winManager) window.winManager.setTitle(this.winId, title);

    const clockBadge = document.getElementById(`${this.winId}-clock-badge`);
    if (clockBadge) {
      clockBadge.textContent = `${hw.mhz} МГц (${hw.fsb}×${hw.mult})`;
    }

    const specTable = document.getElementById(`${this.winId}-spec-table`);
    if (specTable) {
      const ocClass = hw.mhz > 450 ? 'oc' : (hw.mhz < 450 ? 'warn' : '');
      const cacheClass = (!hw.l1 || !hw.l2) ? 'warn' : '';
      specTable.innerHTML = `
        <tr>
          <td class="wt-spec-key">Процессор (Slot 1):</td>
          <td class="wt-spec-val ${ocClass}">Intel Pentium II ${hw.mhz} МГц (${hw.fsb} МГц × ${hw.mult}) ${hw.mhz > 450 ? '[РАЗГОН!]' : ''}</td>
        </tr>
        <tr>
          <td class="wt-spec-key">Кэш L1 / L2:</td>
          <td class="wt-spec-val ${cacheClass}">L1: ${hw.l1 ? '32 КБ Вкл' : 'ОТКЛЮЧЕН!'} • L2: ${hw.l2 ? '512 КБ Вкл' : 'ОТКЛЮЧЕН!'}</td>
        </tr>
        <tr>
          <td class="wt-spec-key">Память SDRAM:</td>
          <td class="wt-spec-val">128 МБ PC100 • Тайминг CAS-${hw.cas2 ? '2 (Быстро)' : '3 (Норма)'}</td>
        </tr>
        <tr>
          <td class="wt-spec-key">Видеоускоритель:</td>
          <td class="wt-spec-val">3dfx Voodoo2 12MB • AGP ${hw.agp2x ? '2X' : '1X'} (${hw.aperture})</td>
        </tr>
        <tr>
          <td class="wt-spec-key">Дисковый контроллер:</td>
          <td class="wt-spec-val">Primary Master • ${hw.udma ? 'UltraDMA/33 (33 МБ/с)' : 'PIO Mode 4 (Медленно)'}</td>
        </tr>
      `;
    }

    document.querySelectorAll(`#${this.winId}-tabs .wt-metric-tab`).forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.metric === this.activeMetric);
    });

    this.renderComparisonBars(hw);
    this.updateAdvisor(hw);
  }

  renderComparisonBars(hw) {
    const barsEl = document.getElementById(`${this.winId}-bars`);
    if (!barsEl) return;

    const metric = this.activeMetric;
    const meta = this.metricsMeta[metric];
    const userVal = hw.scores[metric];

    const allRows = [
      {
        name: `★ Ваш ПК: Pentium II ${hw.mhz} МГц (${hw.fsb}×${hw.mult})`,
        val: userVal,
        isUser: true
      },
      ...this.referenceRigs.map((r) => ({
        name: r.name,
        val: r[metric],
        isUser: false
      }))
    ].sort((a, b) => b.val - a.val);

    const maxVal = Math.max(...allRows.map((r) => r.val), 1);

    barsEl.innerHTML = allRows.map((row) => {
      const pct = Math.max(4, Math.round((row.val / maxVal) * 100));
      return `
        <div class="wt-bar-row ${row.isUser ? 'user-rig' : ''}">
          <span class="wt-bar-label" title="${row.name}">${row.name}</span>
          <div class="wt-bar-track">
            <div class="wt-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="wt-bar-score">${row.val} ${meta.unit}</span>
        </div>
      `;
    }).join('');
  }

  updateAdvisor(hw) {
    const textEl = document.getElementById(`${this.winId}-advisor-text`);
    if (!textEl) return;

    if (!hw.l1 || !hw.l2) {
      textEl.textContent = '⚠ Внимание: Кэш процессора отключён в BIOS! Включите L1/L2 Cache для 5-кратного ускорения.';
    } else if (!hw.udma) {
      textEl.textContent = '💡 Совет: Включите IDE UltraDMA в BIOS для увеличения скорости диска с 8 до 22 МБ/с.';
    } else if (hw.mhz <= 450) {
      textEl.textContent = `💡 Совет: Поднимите шину FSB до 112 МГц (${Math.round(112 * hw.mult)} МГц) в BIOS или кнопкой справа, чтобы обогнать эталонный Pentium II 450!`;
    } else {
      textEl.textContent = `🔥 Отличный разгон! Ваш Pentium II @ ${hw.mhz} МГц (${hw.scores.cpuInt} MIPS) опережает штатный Pentium II 450!`;
    }
  }

  runSingleStage(stage) {
    this.stopBenchAnimation();
    this.running = true;
    const stageMap = {
      cpu: { metric: 'cpuInt', label: 'CPU / FPU SIMD FRACTAL', duration: 1300 },
      '2d': { metric: 'video2d', label: '2D GDI BITBLT TORTURE', duration: 1300 },
      '3d': { metric: 'video3d', label: '3D DIRECT3D TORUS', duration: 1500 },
      disk: { metric: 'diskIo', label: 'DISK CACHED I/O', duration: 1200 }
    };
    const cfg = stageMap[stage] || stageMap.cpu;
    this.activeMetric = cfg.metric;
    this.refreshAll();
    this.animateStage(stage, cfg.label, cfg.duration, () => {
      this.running = false;
      if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
      this.refreshAll();
    });
  }

  runFullBenchmark() {
    this.stopBenchAnimation();
    this.running = true;
    const sequence = [
      { stage: 'cpu', metric: 'cpuInt', label: '1/4 • CPU DHRYSTONE / FPU', duration: 950 },
      { stage: '2d', metric: 'video2d', label: '2/4 • 2D GDI BITBLT', duration: 950 },
      { stage: '3d', metric: 'video3d', label: '3/4 • 3D GLIDE TORUS', duration: 1100 },
      { stage: 'disk', metric: 'diskIo', label: '4/4 • CACHED DISK I/O', duration: 900 }
    ];

    let idx = 0;
    const next = () => {
      if (!this.running || idx >= sequence.length) {
        this.running = false;
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        const vpStage = document.getElementById(`${this.winId}-vp-stage`);
        if (vpStage) vpStage.textContent = 'ТЕСТ ЗАВЕРШЕН УСПЕШНО';
        this.refreshAll();
        return;
      }
      const item = sequence[idx++];
      this.activeMetric = item.metric;
      this.refreshAll();
      this.animateStage(item.stage, item.label, item.duration, next);
    };

    next();
  }

  animateStage(stage, label, duration, onDone) {
    const canvas = document.getElementById(`${this.winId}-canvas`);
    if (!canvas) {
      if (onDone) onDone();
      return;
    }
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const hw = this.readHardwareTelemetry();
    const start = performance.now();

    const vpStage = document.getElementById(`${this.winId}-vp-stage`);
    const vpFps = document.getElementById(`${this.winId}-vp-fps`);
    if (vpStage) vpStage.textContent = label;

    const frame = (now) => {
      if (!this.running) return;
      const elapsed = now - start;
      const t = elapsed * 0.004 * (hw.mhz / 450);

      if (stage === 'cpu') {
        for (let y = 0; y < h; y += 4) {
          for (let x = 0; x < w; x += 6) {
            const v = Math.sin(x * 0.04 + t * 2) + Math.cos(y * 0.05 - t * 1.6);
            const r = Math.round(127 + 120 * Math.sin(v + t));
            const g = Math.round(127 + 120 * Math.cos(v * 1.4));
            const b = Math.round(180 + 70 * Math.sin(t));
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 6, 4);
          }
        }
        if (vpFps) vpFps.textContent = `${hw.scores.cpuInt} MIPS`;
      } else if (stage === '2d') {
        for (let i = 0; i < 6; i++) {
          const rx = (Math.sin(t * (i + 1) * 1.7) * 0.4 + 0.4) * w;
          const ry = (Math.cos(t * (i + 2) * 1.3) * 0.4 + 0.4) * h;
          ctx.fillStyle = ['#000080', '#008080', '#800000', '#ffff00', '#00ff00', '#ffffff'][i % 6];
          ctx.fillRect(rx, ry, 58, 32);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(rx, ry, 58, 32);
        }
        if (vpFps) vpFps.textContent = `${hw.scores.video2d} MPix/s`;
      } else if (stage === '3d') {
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const rings = 14;
        const segs = 12;
        for (let i = 0; i < rings; i++) {
          const u = (i / rings) * Math.PI * 2;
          for (let j = 0; j < segs; j++) {
            const v = (j / segs) * Math.PI * 2;
            const R = 42;
            const r = 18;
            const x0 = (R + r * Math.cos(v)) * Math.cos(u);
            const y0 = (R + r * Math.cos(v)) * Math.sin(u);
            const z0 = r * Math.sin(v);

            const x1 = x0 * Math.cos(t) - z0 * Math.sin(t);
            const z1 = x0 * Math.sin(t) + z0 * Math.cos(t);
            const y1 = y0 * Math.cos(t * 0.7) - z1 * Math.sin(t * 0.7);
            const z2 = y0 * Math.sin(t * 0.7) + z1 * Math.cos(t * 0.7) + 120;

            const sx = cx + (x1 * 110) / z2;
            const sy = cy + (y1 * 110) / z2;
            const shade = Math.max(60, Math.min(255, Math.round(180 - z1 * 1.4)));
            ctx.fillStyle = `rgb(${Math.round(shade * 0.4)}, ${shade}, 255)`;
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
          }
        }
        if (vpFps) vpFps.textContent = `${hw.scores.video3d} FPS`;
      } else if (stage === 'disk') {
        ctx.fillStyle = '#05120c';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#14452f';
        for (let y = 20; y < h; y += 25) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        const prog = Math.min(1, elapsed / duration);
        const endX = Math.floor(prog * (w - 20)) + 10;
        ctx.strokeStyle = '#38ff7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 10; x <= endX; x += 4) {
          const jitter = Math.sin(x * 0.25 + t * 3) * 8;
          const py = h * 0.38 + jitter + (x / w) * 18;
          if (x === 10) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        if (vpFps) vpFps.textContent = `${hw.scores.diskIo} MB/s`;
      }

      if (elapsed < duration) {
        this.animFrame = requestAnimationFrame(frame);
      } else if (onDone) {
        onDone();
      }
    };

    this.animFrame = requestAnimationFrame(frame);
  }

  drawIdleViewport() {
    const canvas = document.getElementById(`${this.winId}-canvas`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#071120';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1b3a64';
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WINTUNE 97 / CLIBENCH', w / 2, h / 2 - 10);
    ctx.fillStyle = '#9ec5ff';
    ctx.font = '11px Courier New, monospace';
    ctx.fillText('Нажмите «Тест системы»', w / 2, h / 2 + 12);
  }

  stopBenchAnimation() {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    if (this.stageTimer) {
      clearTimeout(this.stageTimer);
      this.stageTimer = null;
    }
  }

  cleanup() {
    this.stopBenchAnimation();
  }
}

window.appWintune = new AppWintune();
