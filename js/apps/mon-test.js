class AppMonTest {
  constructor() {
    this.winId = 'win-mon-test';
    this.activePattern = null;
    this.subMode = 0;
    this.isFullscreen = false;
    this.hvTimer = null;
    this.hvPhase = false;
    this.keyHandler = null;
    this.osd = {
      scanlines: 35,
      convergence: 0.4,
      brightness: 100,
      contrast: 100,
      degaussCount: 0
    };
    this.patterns = [
      {
        id: 'geometry',
        num: '01',
        title: 'Геометрия',
        eng: 'Geometry',
        modes: ['Сетка и окружности', 'Геометрия углов', 'Линейность растра'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><g stroke="#fff" stroke-width="1" fill="none"><rect x="2" y="2" width="64" height="46"/><line x1="34" y1="2" x2="34" y2="48"/><line x1="2" y1="25" x2="66" y2="25"/><circle cx="34" cy="25" r="18"/><circle cx="7" cy="7" r="4"/><circle cx="61" cy="7" r="4"/><circle cx="7" cy="43" r="4"/><circle cx="61" cy="43" r="4"/></g></svg>`
      },
      {
        id: 'convergence',
        num: '02',
        title: 'Сведение',
        eng: 'Convergence',
        modes: ['Белая сетка RGB', 'Кресты сведения', 'Вертикальные пары R/G/B'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><g stroke-width="1"><line x1="16" y1="4" x2="16" y2="46" stroke="#ff2020"/><line x1="18" y1="4" x2="18" y2="46" stroke="#20ff20"/><line x1="20" y1="4" x2="20" y2="46" stroke="#4080ff"/><line x1="48" y1="4" x2="48" y2="46" stroke="#ffffff"/><line x1="6" y1="15" x2="62" y2="15" stroke="#ff40ff"/><line x1="6" y1="35" x2="62" y2="35" stroke="#40ffff"/></g></svg>`
      },
      {
        id: 'brightness',
        num: '03',
        title: 'Яркость / Контр.',
        eng: 'Brightness',
        modes: ['Клин серого 0–100%', 'Уровень чёрного (1%–8%)', 'Шахматный контраст'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><rect x="4" y="8" width="10" height="34" fill="#181818"/><rect x="14" y="8" width="10" height="34" fill="#404040"/><rect x="24" y="8" width="10" height="34" fill="#707070"/><rect x="34" y="8" width="10" height="34" fill="#a0a0a0"/><rect x="44" y="8" width="10" height="34" fill="#d0d0d0"/><rect x="54" y="8" width="10" height="34" fill="#ffffff"/></svg>`
      },
      {
        id: 'highvoltage',
        num: '04',
        title: 'Высокое напр.',
        eng: 'High Voltage',
        modes: ['Импульс растра (1.2 Гц)', 'Стабилизация БП (0.5 Гц)'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><rect x="6" y="6" width="56" height="38" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3,2"/><rect x="16" y="12" width="36" height="26" fill="#fff"/><text x="34" y="29" text-anchor="middle" fill="#000" font-size="9" font-weight="bold">27 kV</text></svg>`
      },
      {
        id: 'colors',
        num: '05',
        title: 'Цветопередача',
        eng: 'Colors',
        modes: ['Цветовые полосы SMPTE/RGB', 'Чистый Красный (R)', 'Чистый Зелёный (G)', 'Чистый Синий (B)', 'Чистый Белый (W)'],
        svg: `<svg viewBox="0 0 68 50"><rect x="2" y="4" width="10" height="42" fill="#ffffff"/><rect x="12" y="4" width="9" height="42" fill="#ffff00"/><rect x="21" y="4" width="9" height="42" fill="#00ffff"/><rect x="30" y="4" width="9" height="42" fill="#00ff00"/><rect x="39" y="4" width="9" height="42" fill="#ff00ff"/><rect x="48" y="4" width="9" height="42" fill="#ff0000"/><rect x="57" y="4" width="9" height="42" fill="#0000ff"/></svg>`
      },
      {
        id: 'moire',
        num: '06',
        title: 'Муар',
        eng: 'To Moire',
        modes: ['Вертикальная решётка 1px', 'Шахматная микросетка', 'Концентрические кольца'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><g stroke="#fff" stroke-width="1"><line x1="6" y1="4" x2="6" y2="46"/><line x1="10" y1="4" x2="10" y2="46"/><line x1="14" y1="4" x2="14" y2="46"/><line x1="18" y1="4" x2="18" y2="46"/><line x1="22" y1="4" x2="22" y2="46"/><line x1="26" y1="4" x2="26" y2="46"/><circle cx="48" cy="25" r="16" fill="none"/><circle cx="48" cy="25" r="12" fill="none"/><circle cx="48" cy="25" r="8" fill="none"/><circle cx="48" cy="25" r="4" fill="none"/></g></svg>`
      },
      {
        id: 'sharpness',
        num: '07',
        title: 'Чёткость',
        eng: 'Sharpness',
        modes: ['Штриховые миры (МГц)', 'Полосы 1px / 2px / 4px'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><g fill="#fff"><rect x="6" y="8" width="4" height="34"/><rect x="14" y="8" width="4" height="34"/><rect x="26" y="8" width="2" height="34"/><rect x="30" y="8" width="2" height="34"/><rect x="34" y="8" width="2" height="34"/><rect x="44" y="8" width="1" height="34"/><rect x="46" y="8" width="1" height="34"/><rect x="48" y="8" width="1" height="34"/><rect x="50" y="8" width="1" height="34"/><rect x="52" y="8" width="1" height="34"/><rect x="54" y="8" width="1" height="34"/></g></svg>`
      },
      {
        id: 'focus',
        num: '08',
        title: 'Фокусировка',
        eng: 'Focus',
        modes: ['Символьная матрица (@)', 'Точечная матрица ЭЛТ'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#000"/><g fill="#fff" font-family="monospace" font-size="9"><text x="6" y="14">@ @ @ @</text><text x="6" y="28">@ @ @ @</text><text x="6" y="42">@ @ @ @</text></g></svg>`
      },
      {
        id: 'readability',
        num: '09',
        title: 'Читаемость',
        eng: 'Readability',
        modes: ['Белый текст на чёрном', 'Чёрный текст на белом'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#fff"/><g fill="#000" font-family="monospace" font-size="6"><text x="4" y="11">NOKIA 447Xpro 85Hz</text><text x="4" y="20">Win 98 CRT Test</text><text x="4" y="29">0123456789 ABCDEF</text><text x="4" y="38">абвгдеёжзийклмноп</text><text x="4" y="46">Microslop Trinitron</text></g></svg>`
      },
      {
        id: 'info',
        num: '10',
        title: 'Паспорт ЭЛТ',
        eng: 'Tube Info',
        modes: ['Диагностический отчёт трубки'],
        svg: `<svg viewBox="0 0 68 50"><rect width="68" height="50" fill="#002266"/><rect x="4" y="4" width="60" height="42" fill="none" stroke="#66aaff" stroke-width="1"/><text x="34" y="22" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="bold">NOKIA</text><text x="34" y="35" text-anchor="middle" fill="#88ccff" font-family="monospace" font-size="8">CRT INFO</text></svg>`
      }
    ];
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      const existing = window.winManager.windows.get(this.winId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.winId);
      else window.winManager.bringToTop(this.winId);
      return existing;
    }

    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay && crtOverlay.classList.contains('active')) {
      this.osd.scanlines = 45;
    }

    const content = `
      <div class="montest-shell" id="${this.winId}-shell">
        <div class="montest-header">
          <div class="montest-brand">
            <div class="montest-nokia-badge">NOKIA</div>
            <div class="montest-title-block">
              <span class="montest-title-main">DISPLAY PRODUCTS • MONITOR TEST</span>
              <span class="montest-title-sub" id="${this.winId}-mode-readout">Trinitron 17" • 1024×768 @ 85Hz (H: 68.7 kHz)</span>
            </div>
          </div>
          <div class="montest-header-actions">
            <button class="montest-hdr-btn montest-hdr-btn-degauss" id="${this.winId}-degauss" title="Размагнитить маску кинескопа">
              <span>&#9889; Размагничивание (Degauss)</span>
            </button>
            <button class="montest-hdr-btn" id="${this.winId}-fs-btn" title="Развернуть тестовую таблицу на весь экран">
              <span>&#9974; Полный экран</span>
            </button>
          </div>
        </div>

        <div class="montest-deck">
          <div class="montest-grid" id="${this.winId}-grid">
            ${this.patterns.map((p) => `
              <button class="montest-tile" data-pattern="${p.id}" title="${p.title} (${p.eng})">
                <span class="montest-tile-num">[F${Number(p.num)}] ${p.eng.toUpperCase()}</span>
                <div class="montest-tile-preview">${p.svg}</div>
                <span class="montest-tile-label">${p.title}</span>
              </button>
            `).join('')}
          </div>

          <div class="montest-osd-panel">
            <div class="montest-osd-group">
              <div class="montest-osd-label">
                <span>SCANLINES (РАСТР)</span>
                <span id="${this.winId}-val-scan">${this.osd.scanlines}%</span>
              </div>
              <input type="range" min="0" max="100" value="${this.osd.scanlines}" class="montest-osd-slider" id="${this.winId}-sl-scan">
            </div>
            <div class="montest-osd-group">
              <div class="montest-osd-label">
                <span>CONVERGENCE (RGB)</span>
                <span id="${this.winId}-val-conv">${this.osd.convergence.toFixed(1)}px</span>
              </div>
              <input type="range" min="0" max="30" value="${Math.round(this.osd.convergence * 10)}" class="montest-osd-slider" id="${this.winId}-sl-conv">
            </div>
            <div class="montest-osd-group">
              <div class="montest-osd-label">
                <span>BRIGHTNESS (ЯРК.)</span>
                <span id="${this.winId}-val-brig">${this.osd.brightness}%</span>
              </div>
              <input type="range" min="80" max="120" value="${this.osd.brightness}" class="montest-osd-slider" id="${this.winId}-sl-brig">
            </div>
            <div class="montest-osd-group">
              <div class="montest-osd-label">
                <span>CONTRAST (КОНТР.)</span>
                <span id="${this.winId}-val-cont">${this.osd.contrast}%</span>
              </div>
              <input type="range" min="80" max="125" value="${this.osd.contrast}" class="montest-osd-slider" id="${this.winId}-sl-cont">
            </div>
          </div>
        </div>

        <div class="montest-osd-footer">
          <span id="${this.winId}-status">Выберите испытательную таблицу (1–10) или настройте сведение ЭЛТ-трубки</span>
          <span>Nokia Display Products • Finland</span>
        </div>

        <div class="montest-stage" id="${this.winId}-stage">
          <canvas class="montest-canvas" id="${this.winId}-canvas"></canvas>
          <div class="montest-stage-hud" id="${this.winId}-hud">
            <span id="${this.winId}-hud-label">01. Геометрия</span>
            <button class="montest-hud-btn" id="${this.winId}-hud-next">Режим [ЛКМ]</button>
            <button class="montest-hud-btn" id="${this.winId}-hud-fs">Полный экран</button>
            <button class="montest-hud-btn" id="${this.winId}-hud-exit">Меню [ПКМ / ESC]</button>
          </div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: 'Nokia Monitor Test for Win 98 (v1.0a)',
      icon: 'mon-test',
      width: 660,
      height: 460,
      minWidth: 560,
      minHeight: 400,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content,
      onClose: () => this.cleanup()
    });

    this.bindEvents(win.element);
    return win;
  }

  bindEvents(winEl) {
    const grid = document.getElementById(`${this.winId}-grid`);
    grid.addEventListener('click', (e) => {
      const tile = e.target.closest('.montest-tile');
      if (!tile) return;
      this.openPattern(tile.dataset.pattern);
    });

    document.getElementById(`${this.winId}-degauss`).addEventListener('click', () => {
      this.triggerDegauss();
    });

    document.getElementById(`${this.winId}-fs-btn`).addEventListener('click', () => {
      this.isFullscreen = !this.isFullscreen;
      document.getElementById(`${this.winId}-fs-btn`).classList.toggle('active', this.isFullscreen);
      if (!this.activePattern && this.isFullscreen) {
        this.openPattern('geometry');
      } else {
        this.syncStageFullscreen();
      }
    });

    const slScan = document.getElementById(`${this.winId}-sl-scan`);
    const slConv = document.getElementById(`${this.winId}-sl-conv`);
    const slBrig = document.getElementById(`${this.winId}-sl-brig`);
    const slCont = document.getElementById(`${this.winId}-sl-cont`);

    slScan.addEventListener('input', () => {
      this.osd.scanlines = Number(slScan.value);
      document.getElementById(`${this.winId}-val-scan`).textContent = `${this.osd.scanlines}%`;
      this.applyCrtCalibration();
    });

    slConv.addEventListener('input', () => {
      this.osd.convergence = Number(slConv.value) / 10;
      document.getElementById(`${this.winId}-val-conv`).textContent = `${this.osd.convergence.toFixed(1)}px`;
      this.applyCrtCalibration();
      if (this.activePattern) this.renderPattern();
    });

    slBrig.addEventListener('input', () => {
      this.osd.brightness = Number(slBrig.value);
      document.getElementById(`${this.winId}-val-brig`).textContent = `${this.osd.brightness}%`;
      this.applyCrtCalibration();
    });

    slCont.addEventListener('input', () => {
      this.osd.contrast = Number(slCont.value);
      document.getElementById(`${this.winId}-val-cont`).textContent = `${this.osd.contrast}%`;
      this.applyCrtCalibration();
    });

    const canvas = document.getElementById(`${this.winId}-canvas`);
    canvas.addEventListener('click', () => {
      this.nextSubMode();
    });
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.closePattern();
    });

    document.getElementById(`${this.winId}-hud-next`).addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextSubMode();
    });

    document.getElementById(`${this.winId}-hud-fs`).addEventListener('click', (e) => {
      e.stopPropagation();
      this.isFullscreen = !this.isFullscreen;
      document.getElementById(`${this.winId}-fs-btn`).classList.toggle('active', this.isFullscreen);
      this.syncStageFullscreen();
    });

    document.getElementById(`${this.winId}-hud-exit`).addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePattern();
    });

    this.keyHandler = (e) => {
      const win = document.getElementById(this.winId);
      if (!win || !win.classList.contains('active')) return;
      if (e.key === 'Escape' && this.activePattern) {
        e.preventDefault();
        this.closePattern();
      } else if (e.key === ' ' && this.activePattern) {
        e.preventDefault();
        this.nextSubMode();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  applyCrtCalibration() {
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
      if (this.osd.scanlines > 0) {
        crtOverlay.classList.add('active');
        document.body.classList.add('crt-enabled');
        const alpha = (this.osd.scanlines / 100) * 0.28;
        const rgbAlpha = (this.osd.scanlines / 100) * 0.03;
        crtOverlay.style.background = `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, ${alpha.toFixed(3)}) 50%), linear-gradient(90deg, rgba(255, 0, 0, ${rgbAlpha.toFixed(3)}), rgba(0, 255, 0, ${(rgbAlpha * 0.6).toFixed(3)}), rgba(0, 0, 255, ${rgbAlpha.toFixed(3)}))`;
        crtOverlay.style.backgroundSize = '100% 3px, 6px 100%';
      } else {
        crtOverlay.classList.remove('active');
        document.body.classList.remove('crt-enabled');
      }
    }

    const desktop = document.getElementById('desktop');
    if (desktop) {
      if (this.osd.brightness === 100 && this.osd.contrast === 100) {
        desktop.style.filter = '';
      } else {
        desktop.style.filter = `brightness(${this.osd.brightness}%) contrast(${this.osd.contrast}%)`;
      }
    }
  }

  triggerDegauss() {
    this.osd.degaussCount++;
    this.osd.convergence = 0.0;
    const slConv = document.getElementById(`${this.winId}-sl-conv`);
    const valConv = document.getElementById(`${this.winId}-val-conv`);
    if (slConv) slConv.value = '0';
    if (valConv) valConv.textContent = '0.0px';

    this.playDegaussAudio();
    document.body.classList.remove('crt-degaussing');
    void document.body.offsetWidth;
    document.body.classList.add('crt-degaussing');

    const statusEl = document.getElementById(`${this.winId}-status`);
    if (statusEl) {
      statusEl.textContent = 'Петля размагничивания: импульс 50 Гц выполнен, остаточная намагниченность маски снята (0.00 мТл)';
    }

    setTimeout(() => {
      document.body.classList.remove('crt-degaussing');
      if (this.activePattern) this.renderPattern();
    }, 1400);
  }

  playDegaussAudio() {
    if (!window.soundSys) return;
    const ctx = window.soundSys.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.25);
    osc.frequency.setValueAtTime(50, now + 0.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 1.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(window.soundSys.masterGain || ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 1.28);
    osc2.stop(now + 1.28);
  }

  openPattern(patternId) {
    this.activePattern = this.patterns.find((p) => p.id === patternId) || this.patterns[0];
    this.subMode = 0;
    const stage = document.getElementById(`${this.winId}-stage`);
    if (!stage) return;
    stage.classList.add('active');
    this.syncStageFullscreen();
    this.startHvTimerIfNeeded();
    this.renderPattern();
  }

  syncStageFullscreen() {
    const stage = document.getElementById(`${this.winId}-stage`);
    if (!stage) return;
    stage.classList.toggle('fullscreen', this.isFullscreen);
    if (this.activePattern) {
      requestAnimationFrame(() => this.renderPattern());
    }
  }

  nextSubMode() {
    if (!this.activePattern) return;
    this.subMode = (this.subMode + 1) % this.activePattern.modes.length;
    this.startHvTimerIfNeeded();
    this.renderPattern();
  }

  closePattern() {
    this.stopHvTimer();
    this.activePattern = null;
    this.isFullscreen = false;
    const stage = document.getElementById(`${this.winId}-stage`);
    if (stage) {
      stage.classList.remove('active', 'fullscreen');
    }
    const fsBtn = document.getElementById(`${this.winId}-fs-btn`);
    if (fsBtn) fsBtn.classList.remove('active');
  }

  startHvTimerIfNeeded() {
    this.stopHvTimer();
    if (this.activePattern && this.activePattern.id === 'highvoltage') {
      const period = this.subMode === 0 ? 900 : 1600;
      this.hvPhase = false;
      this.hvTimer = setInterval(() => {
        this.hvPhase = !this.hvPhase;
        this.renderPattern();
      }, period);
    }
  }

  stopHvTimer() {
    if (this.hvTimer) {
      clearInterval(this.hvTimer);
      this.hvTimer = null;
    }
  }

  renderPattern() {
    const canvas = document.getElementById(`${this.winId}-canvas`);
    if (!canvas || !this.activePattern) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(220, Math.floor(rect.height));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const hudLabel = document.getElementById(`${this.winId}-hud-label`);
    if (hudLabel) {
      const modeName = this.activePattern.modes[this.subMode] || '';
      hudLabel.textContent = `${this.activePattern.num}. ${this.activePattern.title}: ${modeName}`;
    }

    const id = this.activePattern.id;
    if (id === 'geometry') this.drawGeometry(ctx, w, h);
    else if (id === 'convergence') this.drawConvergence(ctx, w, h);
    else if (id === 'brightness') this.drawBrightness(ctx, w, h);
    else if (id === 'highvoltage') this.drawHighVoltage(ctx, w, h);
    else if (id === 'colors') this.drawColors(ctx, w, h);
    else if (id === 'moire') this.drawMoire(ctx, w, h);
    else if (id === 'sharpness') this.drawSharpness(ctx, w, h);
    else if (id === 'focus') this.drawFocus(ctx, w, h);
    else if (id === 'readability') this.drawReadability(ctx, w, h);
    else if (id === 'info') this.drawTubeInfo(ctx, w, h);
  }

  drawGeometry(ctx, w, h) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const cols = 16;
    const rows = 12;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let i = 0; i <= cols; i++) {
      const x = Math.round(i * cellW) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      const y = Math.round(j * cellH) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

    const cx = w / 2;
    const cy = h / 2;
    const mainR = Math.min(w, h) * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
    ctx.stroke();

    if (this.subMode === 0 || this.subMode === 1) {
      const cornerR = Math.min(cellW, cellH) * 1.5;
      const corners = [
        [cornerR + 4, cornerR + 4],
        [w - cornerR - 4, cornerR + 4],
        [cornerR + 4, h - cornerR - 4],
        [w - cornerR - 4, h - cornerR - 4]
      ];
      corners.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, cornerR, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    if (this.subMode === 2) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
    }
  }

  drawConvergence(ctx, w, h) {
    const shift = this.osd.convergence * 2.2;
    const step = 48;

    const drawGrid = (dx, dy, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(Math.round(x + dx) + 0.5, 0);
        ctx.lineTo(Math.round(x + dx) + 0.5, h);
        ctx.stroke();
      }
      for (let y = step / 2; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y + dy) + 0.5);
        ctx.lineTo(w, Math.round(y + dy) + 0.5);
        ctx.stroke();
      }
    };

    ctx.globalCompositeOperation = 'lighter';
    if (this.subMode === 0) {
      drawGrid(-shift, 0, '#ff0000');
      drawGrid(0, 0, '#00ff00');
      drawGrid(shift, 0, '#0055ff');
    } else if (this.subMode === 1) {
      const drawCrosses = (dx, dy, color) => {
        ctx.strokeStyle = color;
        for (let x = step; x < w - 16; x += step) {
          for (let y = step; y < h - 16; y += step) {
            ctx.beginPath();
            ctx.moveTo(x - 10 + dx, y + dy);
            ctx.lineTo(x + 10 + dx, y + dy);
            ctx.moveTo(x + dx, y - 10 + dy);
            ctx.lineTo(x + dx, y + 10 + dy);
            ctx.stroke();
          }
        }
      };
      drawCrosses(-shift, -shift * 0.5, '#ff0000');
      drawCrosses(0, 0, '#00ff00');
      drawCrosses(shift, shift * 0.5, '#0055ff');
    } else {
      for (let x = 30; x < w - 20; x += 60) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - shift, 20, 2, h - 40);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 16, 20, 2, h - 40);
        ctx.fillStyle = '#0066ff';
        ctx.fillRect(x + 32 + shift, 20, 2, h - 40);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  drawBrightness(ctx, w, h) {
    if (this.subMode === 0) {
      const steps = 11;
      const barW = w / steps;
      for (let i = 0; i < steps; i++) {
        const v = Math.round((i / (steps - 1)) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(i * barW, 30, Math.ceil(barW), h - 90);
        ctx.fillStyle = i > 5 ? '#000000' : '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i * 10}%`, i * barW + barW / 2, h - 72);
      }
    } else if (this.subMode === 1) {
      const levels = [1, 2, 3, 4, 5, 6, 8, 10];
      const boxW = (w - 80) / levels.length;
      levels.forEach((pct, idx) => {
        const v = Math.round((pct / 100) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(40 + idx * boxW, h * 0.25, boxW - 8, h * 0.45);
        ctx.strokeStyle = '#333333';
        ctx.strokeRect(40 + idx * boxW, h * 0.25, boxW - 8, h * 0.45);
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pct}%`, 40 + idx * boxW + (boxW - 8) / 2, h * 0.75);
      });
    } else {
      const cols = 4;
      const rows = 3;
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
          ctx.fillRect(c * cw, r * ch, Math.ceil(cw), Math.ceil(ch));
        }
      }
    }
  }

  drawHighVoltage(ctx, w, h) {
    const pad = this.hvPhase ? 6 : 22;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    if (this.hvPhase) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
      ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = '#181818';
      ctx.fillRect(w * 0.35, h * 0.35, w * 0.3, h * 0.3);
      ctx.fillStyle = '#7ef9a9';
    }

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.hvPhase ? 'HIGH VOLTAGE LOAD: 100% WHITE (27.4 kV)' : 'HIGH VOLTAGE LOAD: 5% BLACK (27.5 kV)',
      w / 2,
      h / 2
    );
    ctx.font = '12px monospace';
    ctx.fillText('Дыхание растра при перепаде тока луча: ±1.2 мм (Норма ЭЛТ)', w / 2, h / 2 + 24);
  }

  drawColors(ctx, w, h) {
    if (this.subMode === 0) {
      const colors = ['#ffffff', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff', '#000000'];
      const bw = w / colors.length;
      colors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(idx * bw, 0, Math.ceil(bw), h * 0.7);
      });
      const ramps = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'];
      const rh = (h * 0.3) / ramps.length;
      ramps.forEach((col, rIdx) => {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, col);
        ctx.fillStyle = grad;
        ctx.fillRect(0, h * 0.7 + rIdx * rh, w, Math.ceil(rh));
      });
    } else {
      const pure = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'][this.subMode - 1] || '#ffffff';
      ctx.fillStyle = pure;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawMoire(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    if (this.subMode === 0) {
      for (let x = 0; x < w; x += 2) {
        ctx.fillRect(x, 0, 1, h);
      }
    } else if (this.subMode === 1) {
      for (let y = 0; y < h; y += 2) {
        const offset = (y / 2) % 2;
        for (let x = offset; x < w; x += 4) {
          ctx.fillRect(x, y, 2, 1);
        }
      }
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(cx, cy);
      for (let r = 3; r < maxR; r += 3) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawSharpness(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    if (this.subMode === 0) {
      const bands = [1, 2, 3, 4, 6, 8];
      const sectionW = (w - 40) / bands.length;
      bands.forEach((px, idx) => {
        const startX = 20 + idx * sectionW;
        for (let x = 0; x < sectionW - 12; x += px * 2) {
          ctx.fillRect(startX + x, 30, px, h - 90);
        }
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${px}px (${Math.round(68 / px)} МГц)`, startX + (sectionW - 12) / 2, h - 42);
      });
    } else {
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w / 2, 1);
        ctx.fillRect(w / 2, y, w / 2, 2);
      }
    }
  }

  drawFocus(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    if (this.subMode === 0) {
      ctx.font = '13px Courier New, monospace';
      for (let y = 18; y < h - 16; y += 20) {
        for (let x = 14; x < w - 18; x += 22) {
          ctx.fillText('@', x, y);
        }
      }
    } else {
      for (let y = 8; y < h; y += 8) {
        for (let x = 8; x < w; x += 8) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  }

  drawReadability(ctx, w, h) {
    const inv = this.subMode === 1;
    ctx.fillStyle = inv ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = inv ? '#000000' : '#ffffff';

    const line = 'Nokia Monitor Test • Microslop Win 98 • Проверка фокусировки и читаемости мелкого кегля 0123456789 ';
    ctx.font = '11px Tahoma, Microsoft Sans Serif, sans-serif';
    ctx.textAlign = 'left';
    for (let y = 14; y < h - 10; y += 14) {
      ctx.fillText(line.repeat(3), 8, y);
    }
  }

  drawTubeInfo(ctx, w, h) {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ПАСПОРТ КИНЕСКОПА NOKIA 447Xpro (Trinitron)', 42, 56);

    const lines = [
      `ЭЛТ-трубка:          Sony Trinitron 17" (шаг апертурной решётки 0.25 мм)`,
      `Разрешение и частота: 1024×768 @ 85 Гц (Горизонтальная: 68.7 кГц)`,
      `Полоса пропускания:   135 МГц видеоусилитель RGB`,
      `Текущее несведение:   ${this.osd.convergence.toFixed(1)} пикс. (норма ≤ 0.5 пикс.)`,
      `Интенсивность растра: ${this.osd.scanlines}% (${this.osd.scanlines > 0 ? 'ЭЛТ-фильтр включён' : 'ЭЛТ-фильтр выключен'})`,
      `Яркость / Контраст:   ${this.osd.brightness}% / ${this.osd.contrast}%`,
      `Циклов Degauss:       ${this.osd.degaussCount}`,
      `Статус TCO'95 / MPR2: СООТВЕТСТВУЕТ (Низкое электромагнитное излучение)`
    ];

    ctx.font = '13px Courier New, monospace';
    ctx.fillStyle = '#93c5fd';
    lines.forEach((l, i) => {
      ctx.fillText(l, 42, 96 + i * 24);
    });
  }

  cleanup() {
    this.stopHvTimer();
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}

window.appMonTest = new AppMonTest();
