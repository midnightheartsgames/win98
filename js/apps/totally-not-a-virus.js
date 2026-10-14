/**
 * Win 98 "Totally Not A Virus / Free Smiley Screensaver" Application
 * Retro animated bouncing yellow smileys, funny quotes, turbo, disco, and virus scanner.
 */
class AppVirus {
  constructor() {
    this.animationId = null;
    this.smileys = [];
    this.isTurbo = false;
    this.isDisco = false;
    this.quotes = [
      'HACK THE PLANET! 🌐',
      'DOWNLOADING MORE RAM (99%)... 💾',
      'I AM 100% FRIENDLY! 😊',
      'ALL YOUR BASE ARE BELONG TO US 👾',
      'HELLO WIN 98 USER! 👋',
      'OPTIMIZING 33.6k MODEM... 📞',
      'NO VIRUSES HERE, JUST VIBES! ✨',
      'CLICK ME FOR FREE SMILES! ⭐',
      'DEFRAGGING BRAIN... 🧠',
      'WIN 98 FOREVER! 💻'
    ];
  }

  open() {
    const winId = 'app_virus_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: 'totally_not_a_virus.exe - FREE Smiley Screensaver 98',
      icon: 'file-virus',
      width: 540,
      height: 420,
      content: this.buildHTML()
    });

    this.attachEvents(win, winId);
    this.initCanvas(win);
  }

  buildHTML() {
    return `
      <div class="virus-container">
        <!-- Fun Top Banner -->
        <div class="virus-header-banner">
          ★ БЕСПЛАТНАЯ 3D-ЗАСТАВКА СО СМАЙЛИКАМИ 98 (ТОЧНО НЕ ВИРУС!) ★
        </div>

        <!-- Controls Toolbar -->
        <div class="virus-toolbar">
          <button class="virus-btn btn-more-smileys" title="Добавить 5 веселых смайликов">
            ➕ Смайлики (+5)
          </button>
          <button class="virus-btn btn-turbo" title="Переключить турбо-скорость">
            ⚡ Турбо-режим
          </button>
          <button class="virus-btn btn-disco" title="Включить диско-подсветку">
            🌈 Дискотека
          </button>
          <button class="virus-btn btn-scan" title="Запустить проверку на вирусы">
            🛡️ Проверка
          </button>
          <button class="virus-btn btn-fullscreen" title="Запустить на весь экран">
            🖥️ На весь экран
          </button>
        </div>

        <!-- Canvas Area -->
        <div class="virus-canvas-wrapper">
          <canvas class="virus-canvas"></canvas>
        </div>

        <!-- Statusbar -->
        <div class="win-statusbar">
          <div class="win-status-pane grow virus-status">Статус: Заставка активна (Смайликов: 6)</div>
          <div class="win-status-pane virus-threat" style="width:140px; color:#006600; font-weight:bold;">Угроза: 0.0% (Безопасно)</div>
          <div class="win-status-pane" style="width:70px; text-align:center;">60 FPS</div>
        </div>
      </div>
    `;
  }

  attachEvents(win, winId) {
    const el = win.element;
    const btnMore = el.querySelector('.btn-more-smileys');
    const btnTurbo = el.querySelector('.btn-turbo');
    const btnDisco = el.querySelector('.btn-disco');
    const btnScan = el.querySelector('.btn-scan');
    const btnFullscreen = el.querySelector('.btn-fullscreen');
    const statusText = el.querySelector('.virus-status');

    btnMore.addEventListener('click', () => {
      this.spawnSmileys(win, 5);
      if (window.soundSys) window.soundSys.playClick();
      statusText.textContent = `Статус: Заставка активна (Смайликов: ${this.smileys.length})`;
    });

    btnTurbo.addEventListener('click', () => {
      this.isTurbo = !this.isTurbo;
      btnTurbo.classList.toggle('active', this.isTurbo);
      if (window.soundSys) window.soundSys.playClick();
      this.smileys.forEach(s => {
        const mult = this.isTurbo ? 2.5 : 0.4;
        s.vx *= mult;
        s.vy *= mult;
      });
    });

    btnDisco.addEventListener('click', () => {
      this.isDisco = !this.isDisco;
      btnDisco.classList.toggle('active', this.isDisco);
      if (window.soundSys) window.soundSys.playClick();
    });

    btnScan.addEventListener('click', () => {
      this.runVirusScan();
    });

    btnFullscreen.addEventListener('click', () => {
      this.startFullscreenScreensaver();
    });

    // Cleanup when window is closed
    const origClose = win.close;
    win.close = () => {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      if (origClose) origClose.call(win);
    };
  }

  initCanvas(win) {
    const el = win.element;
    const canvas = el.querySelector('.virus-canvas');
    const wrapper = el.querySelector('.virus-canvas-wrapper');
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial 6 smileys
    this.smileys = [];
    for (let i = 0; i < 6; i++) {
      this.addSmiley(canvas.width, canvas.height);
    }

    let discoHue = 0;

    const animate = () => {
      if (!win.element || !document.body.contains(win.element)) {
        return; // Stopped
      }

      if (canvas.width !== wrapper.clientWidth || canvas.height !== wrapper.clientHeight) {
        resize();
      }

      // Clear or disco backdrop
      if (this.isDisco) {
        discoHue = (discoHue + 2) % 360;
        ctx.fillStyle = `hsla(${discoHue}, 70%, 15%, 0.3)`;
      } else {
        ctx.fillStyle = 'rgba(0, 0, 30, 0.35)'; // trails
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each smiley
      this.smileys.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;

        // Bounce horizontally
        if (s.x - s.r <= 0) {
          s.x = s.r;
          s.vx = -s.vx;
          this.onBounce(s);
        } else if (s.x + s.r >= canvas.width) {
          s.x = canvas.width - s.r;
          s.vx = -s.vx;
          this.onBounce(s);
        }

        // Bounce vertically
        if (s.y - s.r <= 0) {
          s.y = s.r;
          s.vy = -s.vy;
          this.onBounce(s);
        } else if (s.y + s.r >= canvas.height) {
          s.y = canvas.height - s.r;
          s.vy = -s.vy;
          this.onBounce(s);
        }

        // Draw Smiley Body
        ctx.save();
        ctx.translate(s.x, s.y);

        // Yellow face
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-s.r * 0.3, -s.r * 0.3, s.r * 0.1, 0, 0, s.r);
        grad.addColorStop(0, '#ffff99');
        grad.addColorStop(0.7, '#ffcc00');
        grad.addColorStop(1, '#ff9900');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Eyes
        const eyeOffset = s.r * 0.35;
        const eyeR = s.r * 0.16;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-eyeOffset, -eyeOffset * 0.6, eyeR, eyeR * 1.4, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeOffset, -eyeOffset * 0.6, eyeR, eyeR * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye glints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-eyeOffset + 1, -eyeOffset * 0.6 - 1, eyeR * 0.4, 0, Math.PI * 2);
        ctx.arc(eyeOffset + 1, -eyeOffset * 0.6 - 1, eyeR * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Grin
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.62, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.lineWidth = Math.max(2, s.r * 0.1);
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        ctx.restore();

        // Draw speech quote
        if (s.quoteTimer > 0) {
          s.quoteTimer--;
          ctx.save();
          ctx.font = 'bold 11px Arial, sans-serif';
          const textW = ctx.measureText(s.quote).width;
          const bubbleX = Math.min(canvas.width - textW - 16, Math.max(8, s.x - textW / 2));
          const bubbleY = Math.max(20, s.y - s.r - 12);

          ctx.fillStyle = '#ffffcc';
          ctx.fillRect(bubbleX - 4, bubbleY - 14, textW + 8, 18);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(bubbleX - 4, bubbleY - 14, textW + 8, 18);

          ctx.fillStyle = '#000080';
          ctx.fillText(s.quote, bubbleX, bubbleY);
          ctx.restore();
        }
      });

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  addSmiley(w, h) {
    const r = Math.floor(Math.random() * 12) + 20; // 20 to 32px
    const speed = (this.isTurbo ? 6 : 2.5) * (Math.random() * 0.6 + 0.8);
    const angle = Math.random() * Math.PI * 2;
    this.smileys.push({
      x: Math.max(r, Math.min(w - r, Math.random() * w)),
      y: Math.max(r, Math.min(h - r, Math.random() * h)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: r,
      quote: this.quotes[Math.floor(Math.random() * this.quotes.length)],
      quoteTimer: Math.random() > 0.5 ? Math.floor(Math.random() * 120) + 60 : 0
    });
  }

  spawnSmileys(win, count) {
    const canvas = win.element.querySelector('.virus-canvas');
    for (let i = 0; i < count; i++) {
      this.addSmiley(canvas.width || 400, canvas.height || 300);
    }
  }

  onBounce(smiley) {
    if (Math.random() < 0.25) {
      smiley.quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
      smiley.quoteTimer = 90; // show for 1.5 seconds
    }
  }

  runVirusScan() {
    const stages = [
      'Инициализация сканера Microslop Antivirus 1998...',
      'Проверка оперативной памяти (64 МБ ОЗУ)...',
      'Проверка файлов C:\\WINDOWS\\SYSTEM\\... OK',
      'Анализ файла totally_not_a_virus.exe...',
      'Проверка на трояны, черви и шуточные программы...',
      'Результат проверки: 0 вирусов найдено!\nФайл 100% безопасен, дружелюбен и готов поднимать настроение! 😊'
    ];

    let current = 0;
    const updateMsg = (dialog, contentEl) => {
      if (current < stages.length) {
        contentEl.innerHTML = `
          <div style="padding:10px;">
            <div style="font-weight:bold; margin-bottom:8px;">Microslop AntiVirus 98:</div>
            <div style="font-family:monospace; font-size:11px; background:#fff; border:1px solid #808080; padding:6px; min-height:50px; white-space:pre-wrap;">${stages[current]}</div>
            <div style="margin-top:10px; height:16px; background:#e0e0e0; border:1px solid #808080; position:relative; overflow:hidden;">
              <div style="height:100%; width:${Math.round(((current + 1) / stages.length) * 100)}%; background:#000080; transition:width 0.3s;"></div>
            </div>
          </div>
        `;
        current++;
        setTimeout(() => updateMsg(dialog, contentEl), 700);
      }
    };

    const dialog = window.winManager.openDialog({
      title: 'Антивирусная проверка - Win 98',
      icon: 'file-virus',
      message: 'Запуск сканирования...',
      buttons: [{ text: 'ОК', primary: true, onClick: null }]
    });

    const bodyEl = dialog.element.querySelector('.win-dialog-body');
    if (bodyEl) {
      updateMsg(dialog, bodyEl);
    }
  }

  startFullscreenScreensaver() {
    const overlay = document.createElement('div');
    overlay.className = 'virus-fullscreen-overlay';
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    const ctx = canvas.getContext('2d');
    const fullSmileys = [];
    for (let i = 0; i < 24; i++) {
      const r = Math.floor(Math.random() * 20) + 24;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      fullSmileys.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: r
      });
    }

    let animId;
    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 10, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fullSmileys.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x - s.r <= 0 || s.x + s.r >= canvas.width) s.vx = -s.vx;
        if (s.y - s.r <= 0 || s.y + s.r >= canvas.height) s.vy = -s.vy;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        const eyeOffset = s.r * 0.35;
        const eyeR = s.r * 0.16;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(s.x - eyeOffset, s.y - eyeOffset * 0.6, eyeR, eyeR * 1.4, 0, 0, Math.PI * 2);
        ctx.ellipse(s.x + eyeOffset, s.y - eyeOffset * 0.6, eyeR, eyeR * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 0.6, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.lineWidth = Math.max(2, s.r * 0.1);
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const closeOverlay = () => {
      cancelAnimationFrame(animId);
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', closeOverlay);
    };

    const onKey = (e) => {
      closeOverlay();
    };

    setTimeout(() => {
      overlay.addEventListener('click', closeOverlay);
      window.addEventListener('keydown', onKey);
    }, 200);
  }
}

window.appVirus = new AppVirus();

