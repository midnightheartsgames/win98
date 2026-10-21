class AppNeko {
  constructor() {
    this.storageKey = 'win98_neko_settings';
    this.basketWinId = 'app_neko_basket';
    this.spriteSize = 32;

    this.enabled = false;
    this.layerEl = null;
    this.canvas = null;
    this.ctx = null;
    this.actorEl = null;
    this.trayEl = null;
    this.animId = null;
    this.basketAnimId = null;

    this.x = 220;
    this.y = 220;
    this.targetX = 220;
    this.targetY = 220;
    this.speed = 3.5;
    this.state = 'sitting';
    this.direction = 's';
    this.scratchDir = 's';
    this.frame = 0;
    this.idleTime = 0;
    this.stateTimer = 0;
    this.sleepLockUntil = 0;
    this.sleepZzz = [];
    this.particles = [];
    this.pawprints = [];
    this.prop = null;

    this.isDragging = false;
    this.dragMoved = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastMouseX = 220;
    this.lastMouseY = 220;
    this.mouseVelX = 0;
    this.wanderTimer = 0;
    this.secretWord = 'CLAUDE';
    this.secretPos = 0;
    this.basketPerkUntil = 0;

    this.stats = {
      petted: 0,
      paperBallsBatted: 0,
      yarnBatted: 0,
      fishEaten: 0,
      clippyVisits: 0
    };

    this.settings = this.loadSettings();
    this.speed = Number(this.settings.speed) || 3.5;
    this.compiledFrames = this.compileFrames(this.getRawFrames());
    this.clawdFrames = this.compileFrames(this.getClawdRawFrames());
    this.initEvents();
    if (this.isClawd() && window.desktop && typeof window.desktop.renderIcons === 'function') {
      window.desktop.renderIcons();
    }
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  isRu() {
    return !window.i18n || window.i18n.currentLang !== 'en';
  }

  loadSettings() {
    const defaults = {
      coat: 'white',
      mode: 'chase',
      speed: 3.5,
      sound: true,
      pawprints: true,
      clawdUnlocked: false,
      prevCoat: 'white'
    };
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { ...defaults, ...parsed };
          }
        }
      }
    } catch (e) {}
    return defaults;
  }

  saveSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      }
    } catch (e) {}
    this.speed = Number(this.settings.speed) || 3.5;
    this.updateTrayIcon();
    this.updateTrayTooltip();
    this.refreshBasketWindow();
  }

  getCoats() {
    return {
      white: {
        id: 'white',
        nameRu: 'Белый',
        nameEn: 'White',
        fullRu: 'Белый (Классический Neko)',
        fullEn: 'Classic White Neko',
        swatch: 'linear-gradient(135deg, #ffffff 55%, #fda4af 55%)',
        palette: {
          k: '#111827', b: '#ffffff', s: '#dbe4f0', p: '#cbd5e1', w: '#ffffff',
          e: '#fda4af', y: '#1e293b', g: '#ffffff', n: '#f43f5e', c: '#dc2626', z: '#facc15', r: '#ef4444'
        }
      },
      ginger: {
        id: 'ginger',
        nameRu: 'Рыжик',
        nameEn: 'Ginger',
        fullRu: 'Рыжий полосатый (Рыжик)',
        fullEn: 'Ginger Tabby',
        swatch: 'linear-gradient(135deg, #f59e0b 55%, #b45309 55%)',
        palette: {
          k: '#1c1008', b: '#f59e0b', s: '#b45309', p: '#92400e', w: '#fef3c7',
          e: '#fda4af', y: '#15803d', g: '#ffffff', n: '#fb7185', c: '#1d4ed8', z: '#facc15', r: '#ef4444'
        }
      },
      calico: {
        id: 'calico',
        nameRu: 'Мурка',
        nameEn: 'Calico',
        fullRu: 'Трёхцветная (Мурка)',
        fullEn: 'Calico Cat',
        swatch: 'linear-gradient(90deg, #ffffff 34%, #ea580c 34%, #ea580c 67%, #292524 67%)',
        palette: {
          k: '#181310', b: '#fffdf9', s: '#ea580c', p: '#292524', w: '#ffffff',
          e: '#fda4af', y: '#ca8a04', g: '#ffffff', n: '#f43f5e', c: '#dc2626', z: '#facc15', r: '#ef4444'
        }
      },
      black: {
        id: 'black',
        nameRu: 'Ночка',
        nameEn: 'Black',
        fullRu: 'Чёрный кот (Ночка)',
        fullEn: 'Midnight Black',
        swatch: 'linear-gradient(135deg, #27272a 60%, #facc15 60%)',
        palette: {
          k: '#09090b', b: '#27272a', s: '#18181b', p: '#3f3f46', w: '#3f3f46',
          e: '#be185d', y: '#facc15', g: '#ffffff', n: '#f472b6', c: '#dc2626', z: '#fde047', r: '#ef4444'
        }
      },
      siamese: {
        id: 'siamese',
        nameRu: 'Сиам',
        nameEn: 'Siamese',
        fullRu: 'Сиамский (Тайский)',
        fullEn: 'Siamese Seal-Point',
        swatch: 'linear-gradient(135deg, #fef3c7 55%, #451a03 55%)',
        palette: {
          k: '#1c1412', b: '#fef3c7', s: '#d6c3a5', p: '#451a03', w: '#451a03',
          e: '#3b1808', y: '#2563eb', g: '#ffffff', n: '#29150c', c: '#0d9488', z: '#facc15', r: '#ef4444'
        }
      },
      scribble: {
        id: 'scribble',
        nameRu: 'Скрибл',
        nameEn: 'Scribble',
        fullRu: 'Бумажный кот (Скрибл ’97)',
        fullEn: 'Paper Cat (Scribble ’97)',
        swatch: 'repeating-linear-gradient(0deg, #f8fafc 0px, #f8fafc 3px, #93c5fd 3px, #93c5fd 4px)',
        palette: {
          k: '#334155', b: '#f8fafc', s: '#93c5fd', p: '#64748b', w: '#ffffff',
          e: '#cbd5e1', y: '#eab308', g: '#0f172a', n: '#f472b6', c: '#ef4444', z: '#94a3b8', r: '#ef4444'
        }
      },
      clawd: {
        id: 'clawd',
        secret: true,
        frames: 'clawd',
        nameRu: 'Clawd',
        nameEn: 'Clawd',
        fullRu: 'Clawd, талисман Claude',
        fullEn: 'Clawd, the Claude mascot',
        swatch: 'linear-gradient(180deg, #d97757 3px, transparent 3px, transparent 7px, #d97757 7px), linear-gradient(90deg, #d97757 4px, #1f1a17 4px, #1f1a17 6px, #d97757 6px, #d97757 10px, #1f1a17 10px, #1f1a17 12px, #d97757 12px)',
        palette: {
          k: '#1f1a17', b: '#d97757', s: '#b5583c', p: '#b5583c', w: '#e8957a',
          e: '#f2a093', y: '#1f1a17', g: '#ffffff', n: '#b5583c', c: '#d97757', z: '#d97757', r: '#ef4444'
        }
      }
    };
  }

  getCurrentCoat() {
    const coats = this.getCoats();
    return coats[this.settings.coat] || coats.white;
  }

  getVisibleCoatIds() {
    const coats = this.getCoats();
    return Object.keys(coats).filter(id => !coats[id].secret || this.settings.clawdUnlocked);
  }

  isClawd() {
    return this.settings.coat === 'clawd';
  }

  setCoat(coatId) {
    const coats = this.getCoats();
    const coat = coats[coatId];
    if (!coat || (coat.secret && !this.settings.clawdUnlocked)) return false;
    const prev = this.settings.coat;
    if (coatId === 'clawd' && prev !== 'clawd') this.settings.prevCoat = prev;
    this.settings.coat = coatId;
    this.saveSettings();
    this.renderCoatRibbon();
    this.playSound(coatId === 'clawd' ? 'clawd' : 'meow');
    const clawdChanged = (coatId === 'clawd') !== (prev === 'clawd');
    if (clawdChanged) {
      if (this.enabled) this.spawnSparkles(this.x, this.y);
      if (window.desktop && typeof window.desktop.renderIcons === 'function') window.desktop.renderIcons();
    }
    let clippyEvent = null;
    if (clawdChanged) clippyEvent = coatId === 'clawd' ? 'clawd' : 'clawd_off';
    else if (coatId === 'scribble') clippyEvent = 'scribble_coat';
    if (clippyEvent && window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
      window.clippySystem.onNekoEvent(clippyEvent, this);
    }
    return true;
  }

  toggleClawd() {
    if (this.isClawd()) {
      const coats = this.getCoats();
      const back = coats[this.settings.prevCoat];
      return this.setCoat(back && !back.secret ? back.id : 'white');
    }
    this.settings.clawdUnlocked = true;
    if (!this.enabled) this.start();
    return this.setCoat('clawd');
  }

  secretKeyLetter(e) {
    if (e.code && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3);
    if (typeof e.key === 'string' && /^[a-zA-Z]$/.test(e.key)) return e.key.toUpperCase();
    return '';
  }

  onSecretKey(e) {
    const wm = window.winManager;
    if (!wm || wm.activeWindowId !== this.basketWinId) {
      this.secretPos = 0;
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    const letter = this.secretKeyLetter(e);
    if (!letter) return;
    const word = this.secretWord;
    if (letter === word[this.secretPos]) this.secretPos++;
    else this.secretPos = letter === word[0] ? 1 : 0;
    if (this.secretPos > 0) this.basketPerkUntil = Date.now() + 280;
    if (this.secretPos === word.length) {
      this.secretPos = 0;
      this.basketPerkUntil = 0;
      this.toggleClawd();
    }
  }

  think() {
    if (!this.enabled) this.start();
    this.prop = null;
    this.targetX = this.x;
    this.targetY = this.y;
    this.state = 'washing';
    this.idleTime = 60;
    this.sleepLockUntil = Date.now() + 2500;
    this.syncActorElement();
  }

  setMode(mode) {
    const valid = ['chase', 'runaway', 'wander', 'clippy'];
    if (!valid.includes(mode)) return false;
    this.settings.mode = mode;
    this.idleTime = 0;
    this.sleepLockUntil = 0;
    if (mode === 'clippy') {
      this.sendToClippy();
    } else if (mode === 'wander') {
      this.pickWanderTarget();
    }
    this.saveSettings();
    return true;
  }

  setSpeed(speedVal) {
    const v = Math.max(1.5, Math.min(7, Number(speedVal) || 3.5));
    this.settings.speed = v;
    this.speed = v;
    this.saveSettings();
  }

  getScreenW() {
    return (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800;
  }

  getScreenH() {
    return (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 600;
  }

  getTaskbarTop() {
    const screenH = this.getScreenH();
    if (typeof document !== 'undefined' && document.getElementById) {
      const tb = document.getElementById('taskbar');
      if (tb && tb.getBoundingClientRect) {
        const r = tb.getBoundingClientRect();
        if (r && r.height > 0 && r.top > 100 && r.top <= screenH) {
          return Math.round(r.top);
        }
      }
    }
    return screenH - 28;
  }

  getClippyAnchor() {
    const clippy = typeof window !== 'undefined' && window.appClippy;
    if (!clippy || !clippy.visible || !clippy.charEl || !clippy.charEl.getBoundingClientRect) return null;
    const r = clippy.charEl.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return null;
    return {
      x: Math.round(r.left + r.width * 0.5),
      y: Math.round(r.top + r.height * 0.5),
      left: Math.round(r.left),
      top: Math.round(r.top),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
      clippy
    };
  }

  initEvents() {
    if (typeof document === 'undefined') return;
    document.addEventListener('mousemove', (e) => {
      this.mouseVelX = e.clientX - this.lastMouseX;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      if (!this.enabled) return;

      if (this.isDragging) {
        this.dragMoved = true;
        this.x = Math.max(16, Math.min(this.getScreenW() - 16, e.clientX - this.dragOffsetX));
        this.y = Math.max(16, Math.min(this.getTaskbarTop() - 14, e.clientY - this.dragOffsetY));
        this.targetX = this.x;
        this.targetY = this.y;
        this.syncActorElement();
        return;
      }

      if (this.settings.mode === 'chase' && !this.prop) {
        const moved = Math.hypot(e.clientX - this.targetX, e.clientY - this.targetY);
        this.targetX = e.clientX;
        this.targetY = e.clientY;
        if (moved > 6 && Date.now() > this.sleepLockUntil) {
          if (this.state === 'sleeping' || this.state === 'yawning') {
            this.triggerAlert();
          } else if (this.state !== 'purring' && this.state !== 'eating') {
            this.idleTime = 0;
          }
        }
      } else if (this.settings.mode === 'runaway' && !this.prop) {
        const d = Math.hypot(e.clientX - this.x, e.clientY - this.y);
        if (d < 135) {
          const angle = Math.atan2(this.y - e.clientY, this.x - e.clientX);
          const escapeDist = 180;
          this.targetX = Math.max(28, Math.min(this.getScreenW() - 28, Math.round(this.x + Math.cos(angle) * escapeDist)));
          this.targetY = Math.max(28, Math.min(this.getTaskbarTop() - 20, Math.round(this.y + Math.sin(angle) * escapeDist)));
          if (this.state === 'sleeping') this.triggerAlert();
          this.idleTime = 0;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.finishDragging();
      }
    });

    document.addEventListener('keydown', (e) => this.onSecretKey(e));
  }

  triggerAlert() {
    this.state = 'alert';
    this.stateTimer = 18;
    this.idleTime = 0;
    this.playSound('alert');
    setTimeout(() => {
      if (this.state === 'alert' && !this.isDragging) {
        this.state = 'running';
      }
    }, 320);
  }

  isRunning() {
    return Boolean(this.enabled);
  }

  open() {
    if (!this.enabled) {
      this.start();
      this.playSound('meow');
      return this;
    }
    this.openBasket();
    return this;
  }

  toggle() {
    if (this.enabled) {
      this.stop();
      if (window.winManager) {
        window.winManager.openDialog({
          title: 'Neko 98',
          icon: 'neko',
          message: this.t('neko.sleepMsg')
        });
      }
    } else {
      this.start();
      this.playSound('meow');
      if (window.winManager) {
        window.winManager.openDialog({
          title: 'Neko 98',
          icon: 'neko',
          message: this.t('neko.runMsg')
        });
      }
    }
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;
    this.idleTime = 0;
    this.state = 'sitting';
    this.ensureLayer();
    this.ensureTrayIcon();
    this.resizeCanvas();
    if (!this.resizeBound && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      this.resizeBound = () => this.resizeCanvas();
      window.addEventListener('resize', this.resizeBound);
    }
    this.syncActorElement();
    this.refreshBasketWindow();
    this.loop();
  }

  stop() {
    this.enabled = false;
    this.isDragging = false;
    this.prop = null;
    this.sleepZzz = [];
    this.particles = [];
    this.pawprints = [];
    if (this.animId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animId);
    }
    this.animId = null;
    if (this.layerEl && this.layerEl.parentNode) {
      this.layerEl.parentNode.removeChild(this.layerEl);
    }
    this.layerEl = null;
    this.canvas = null;
    this.ctx = null;
    this.actorEl = null;
    this.removeTrayIcon();
    this.refreshBasketWindow();
  }

  ensureLayer() {
    if (typeof document === 'undefined' || !document.body) return;
    if (!this.layerEl) {
      this.layerEl = document.createElement('div');
      this.layerEl.id = 'neko-layer';

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'neko-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '9998';
      this.layerEl.appendChild(this.canvas);

      this.actorEl = document.createElement('div');
      this.actorEl.id = 'neko-actor';
      this.actorEl.className = 'neko-actor';
      this.bindActorEvents(this.actorEl);
      this.layerEl.appendChild(this.actorEl);

      document.body.appendChild(this.layerEl);
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindActorEvents(el) {
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = true;
      this.dragMoved = false;
      this.dragOffsetX = e.clientX - this.x;
      this.dragOffsetY = e.clientY - this.y;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.state = 'dragging';
      this.idleTime = 0;
      el.classList.add('is-dragging');
    });

    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openBasket();
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openContextMenu(e.clientX, e.clientY);
    });
  }

  finishDragging() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.actorEl) this.actorEl.classList.remove('is-dragging');
    if (!this.dragMoved) {
      this.pet();
      return;
    }
    const droppedOnClippy = this.checkDroppedOnClippy();
    if (!droppedOnClippy) {
      this.state = 'sitting';
      this.idleTime = 0;
      this.targetX = this.x;
      this.targetY = this.y;
      this.playSound('pounce');
    }
    this.syncActorElement();
    this.refreshBasketWindow();
  }

  checkDroppedOnClippy() {
    const anchor = this.getClippyAnchor();
    if (!anchor) return false;
    const dist = Math.hypot(this.x - anchor.x, this.y - anchor.y);
    if (dist > 88) return false;
    this.x = Math.max(24, anchor.left - 22);
    this.y = Math.min(this.getTaskbarTop() - 18, anchor.bottom - 14);
    this.targetX = this.x;
    this.targetY = this.y;
    this.direction = 'e';
    this.state = 'purring';
    this.stateTimer = 110;
    this.idleTime = 0;
    this.sleepLockUntil = Date.now() + 5000;
    this.stats.clippyVisits++;
    this.spawnHeart(this.x, this.y - 16);
    this.playSound('purr');
    this.syncActorElement();
    if (window.clippySystem && typeof window.clippySystem.onNekoDroppedOnClippy === 'function') {
      window.clippySystem.onNekoDroppedOnClippy(this);
    }
    return true;
  }

  pet() {
    if (!this.enabled) this.start();
    this.state = 'purring';
    this.stateTimer = 95;
    this.idleTime = 0;
    this.sleepLockUntil = Date.now() + 3500;
    this.targetX = this.x;
    this.targetY = this.y;
    this.stats.petted++;
    this.playSound('purr');
    this.spawnHeart(this.x - 6, this.y - 18);
    this.spawnHeart(this.x + 8, this.y - 22, this.isClawd() ? '✻' : '♪');
    const anchor = this.getClippyAnchor();
    if (anchor && Math.hypot(this.x - anchor.x, this.y - anchor.y) < 120) {
      if (window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
        window.clippySystem.onNekoEvent('purr', this);
      }
    }
    this.refreshBasketWindow();
  }

  spawnHeart(x, y, symbol = '♥') {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.65 - Math.random() * 0.3,
      alpha: 1,
      symbol,
      color: symbol === '♪' ? '#2563eb' : (symbol === '✻' ? '#d97757' : '#e11d48')
    });
  }

  spawnSparkles(x, y) {
    const symbols = ['✻', '✶', '✳'];
    const colors = ['#d97757', '#f59e0b', '#ffffff'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      this.particles.push({
        x: x - 4,
        y: y + 4,
        vx: Math.cos(angle) * 1.6,
        vy: Math.sin(angle) * 1.6 - 0.4,
        alpha: 1,
        symbol: symbols[i % symbols.length],
        color: colors[i % colors.length]
      });
    }
  }

  getTrayIconKey() {
    return this.isClawd() && typeof Icons !== 'undefined' && Icons['clawd'] ? 'clawd' : 'neko';
  }

  updateTrayIcon() {
    if (!this.trayEl || typeof Icons === 'undefined') return;
    const key = this.getTrayIconKey();
    if (this.trayEl.dataset.icon === key) return;
    this.trayEl.dataset.icon = key;
    this.trayEl.innerHTML = Icons[key] || '';
  }

  ensureTrayIcon() {
    if (typeof document === 'undefined') return;
    const tray = document.getElementById('taskbar-tray');
    const clock = document.getElementById('tray-clock');
    if (!tray) return;
    if (this.trayEl && this.trayEl.parentNode === tray) {
      this.updateTrayTooltip();
      return;
    }
    const el = document.createElement('div');
    el.id = 'tray-neko-icon';
    el.className = 'tray-icon';
    el.dataset.icon = this.getTrayIconKey();
    el.innerHTML = (typeof Icons !== 'undefined' && Icons[el.dataset.icon]) ? Icons[el.dataset.icon] : '';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.pet();
    });

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.openBasket();
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openContextMenu(e.clientX, e.clientY);
    });

    if (clock && clock.parentNode === tray) {
      tray.insertBefore(el, clock);
    } else {
      tray.appendChild(el);
    }
    this.trayEl = el;
    this.updateTrayTooltip();
  }

  removeTrayIcon() {
    if (this.trayEl && this.trayEl.parentNode) {
      this.trayEl.parentNode.removeChild(this.trayEl);
    }
    this.trayEl = null;
  }

  updateTrayTooltip() {
    if (!this.trayEl) return;
    const coat = this.getCurrentCoat();
    const label = this.isRu()
      ? `Neko 98 (${coat.nameRu}) — ${this.getStateLabel()} (ЛКМ: ${this.isClawd() ? 'похвалить' : 'погладить'}, ПКМ: меню)`
      : `Neko 98 (${coat.nameEn}) — ${this.getStateLabel()} (Click: ${this.isClawd() ? 'praise' : 'pet'}, Right-click: menu)`;
    this.trayEl.title = label;
  }

  syncActorElement() {
    if (!this.actorEl) return;
    const half = 18;
    this.actorEl.style.left = `${Math.round(this.x - half)}px`;
    this.actorEl.style.top = `${Math.round(this.y - half)}px`;
    this.actorEl.dataset.state = this.state;
    this.actorEl.dataset.direction = this.direction;
    this.actorEl.dataset.coat = this.settings.coat;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.getScreenW();
    this.canvas.height = this.getScreenH();
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  loop() {
    if (!this.enabled) return;
    this.update();
    this.render();
    if (typeof requestAnimationFrame === 'function') {
      this.animId = requestAnimationFrame(() => this.loop());
    }
  }

  sendToClippy() {
    const anchor = this.getClippyAnchor();
    if (!anchor) return false;
    this.targetX = Math.max(24, anchor.left - 24);
    this.targetY = Math.min(this.getTaskbarTop() - 18, anchor.bottom - 14);
    this.idleTime = 0;
    this.stats.clippyVisits++;
    if (this.state === 'sleeping') this.triggerAlert();
    return true;
  }

  pickWanderTarget() {
    const w = this.getScreenW();
    const h = this.getTaskbarTop();
    const edges = this.getWindowEdges();
    if (edges.length > 0 && Math.random() < 0.45) {
      const win = edges[Math.floor(Math.random() * edges.length)];
      this.targetX = Math.round(win.left + 24 + Math.random() * Math.max(20, win.right - win.left - 48));
      this.targetY = Math.max(20, win.top - 14);
      return;
    }
    const anchor = this.getClippyAnchor();
    if (anchor && Math.random() < 0.3) {
      this.targetX = Math.max(24, anchor.left - 24);
      this.targetY = Math.min(h - 18, anchor.bottom - 14);
      return;
    }
    this.targetX = Math.round(36 + Math.random() * Math.max(80, w - 72));
    this.targetY = Math.round(36 + Math.random() * Math.max(80, h - 56));
  }

  spawnToy(kind = 'yarn', opts = {}) {
    if (!this.enabled) this.start();
    const w = this.getScreenW();
    const h = this.getTaskbarTop();
    const anchor = this.getClippyAnchor();

    if (kind === 'paper_ball') {
      const startX = typeof opts.x === 'number' ? opts.x : (anchor ? anchor.left - 10 : Math.min(w - 40, this.x + 120));
      const startY = typeof opts.y === 'number' ? opts.y : (anchor ? anchor.top + 24 : Math.max(40, this.y - 60));
      const vx = typeof opts.vx === 'number' ? opts.vx : (anchor ? -5.2 - Math.random() * 2 : (Math.random() < 0.5 ? 4.5 : -4.5));
      const vy = typeof opts.vy === 'number' ? opts.vy : -2.8 - Math.random() * 1.5;
      this.prop = {
        kind: 'paper_ball',
        x: startX,
        y: startY,
        vx,
        vy,
        bats: 0,
        maxBats: 2,
        returningToClippy: false,
        cooldown: 10
      };
      this.sleepLockUntil = 0;
      this.triggerAlert();
      this.refreshBasketWindow();
      return this.prop;
    }

    if (kind === 'fish') {
      const fx = typeof opts.x === 'number' ? opts.x : (anchor ? Math.max(32, anchor.left - 42) : Math.max(36, Math.min(w - 36, this.x + (Math.random() < 0.5 ? -70 : 70))));
      const fy = typeof opts.y === 'number' ? opts.y : (anchor ? Math.min(h - 16, anchor.bottom - 10) : Math.min(h - 16, this.y + 20));
      this.prop = {
        kind: 'fish',
        x: fx,
        y: fy,
        vx: 0,
        vy: 0,
        biteTimer: 120
      };
      this.sleepLockUntil = 0;
      this.triggerAlert();
      this.refreshBasketWindow();
      return this.prop;
    }

    const yx = typeof opts.x === 'number' ? opts.x : Math.max(40, Math.min(w - 40, this.x + (this.x < w * 0.5 ? 130 : -130)));
    const yy = typeof opts.y === 'number' ? opts.y : Math.max(40, Math.min(h - 24, this.y + (Math.random() - 0.5) * 90));
    this.prop = {
      kind: 'yarn',
      x: yx,
      y: yy,
      vx: (this.x < yx ? 3.6 : -3.6),
      vy: -2.2,
      bats: 0,
      maxBats: 4,
      cooldown: 8,
      trail: []
    };
    this.sleepLockUntil = 0;
    this.triggerAlert();
    this.refreshBasketWindow();
    return this.prop;
  }

  petCat() {
    return this.pet();
  }

  setState(state) {
    this.state = state;
    this.syncActorElement();
  }

  playWithClippy(action = 'toss_paper') {
    if (!this.enabled) this.start();
    const anchor = this.getClippyAnchor();
    const clippy = anchor ? anchor.clippy : (typeof window !== 'undefined' ? window.appClippy : null);

    if (action === 'toss_paper' || action === 'paper') {
      if (clippy && clippy.visible) {
        if (typeof clippy.wakeUp === 'function') clippy.wakeUp(false);
        if (typeof clippy.animate === 'function') clippy.animate('trash');
        if (typeof clippy.sound === 'function') clippy.sound('playClippyTap');
        if (typeof clippy.speak === 'function') {
          clippy.speak(`Скомкал черновик отчёта за третий квартал — лови подачу, ${this.isClawd() ? 'Clawd' : 'Neko'}!`, [], '🗒️', 5500);
        }
      }
      this.spawnToy('paper_ball');
      return true;
    }

    if (action === 'toss_yarn' || action === 'yarn') {
      this.spawnToy('yarn');
      if (anchor && window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
        window.clippySystem.onNekoEvent('yarn', this);
      }
      return true;
    }

    if (action === 'feed_fish' || action === 'fish') {
      if (clippy && clippy.visible && typeof clippy.setAccessory === 'function') {
        clippy.setAccessory('coffee', true);
        setTimeout(() => clippy.setAccessory('coffee', false), 7000);
      }
      this.spawnToy('fish');
      if (window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
        window.clippySystem.onNekoEvent('fish', this);
      }
      return true;
    }

    if (action === 'nap_by_clippy' || action === 'nap') {
      if (anchor) {
        this.x = Math.max(24, anchor.left - 24);
        this.y = Math.min(this.getTaskbarTop() - 18, anchor.bottom - 14);
        this.targetX = this.x;
        this.targetY = this.y;
      }
      this.state = 'sleeping';
      this.idleTime = 220;
      this.sleepLockUntil = Date.now() + 12000;
      this.syncActorElement();
      if (window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
        window.clippySystem.onNekoEvent('nap', this);
      }
      this.refreshBasketWindow();
      return true;
    }

    if (anchor) {
      this.x = Math.max(24, anchor.left - 24);
      this.y = Math.min(this.getTaskbarTop() - 18, anchor.bottom - 14);
      this.targetX = this.x;
      this.targetY = this.y;
      this.direction = 'e';
    }
    this.pet();
    if (clippy && clippy.visible) {
      if (typeof clippy.setAccessory === 'function') {
        clippy.setAccessory('blush', true);
        setTimeout(() => clippy.setAccessory('blush', false), 5000);
      }
      if (typeof clippy.animate === 'function') clippy.animate('wave');
    }
    return true;
  }

  getWindowEdges() {
    const out = [];
    if (typeof document === 'undefined' || !window.winManager || !window.winManager.windows) return out;
    window.winManager.windows.forEach((win) => {
      if (!win || win.isMinimized || !win.element || !win.element.getBoundingClientRect) return;
      if (win.element.style && win.element.style.display === 'none') return;
      const r = win.element.getBoundingClientRect();
      if (!r || r.width < 60 || r.height < 40) return;
      out.push({
        id: win.id,
        left: Math.round(r.left),
        top: Math.round(r.top),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom)
      });
    });
    return out;
  }

  detectNearbyEdge() {
    const w = this.getScreenW();
    const h = this.getTaskbarTop();
    if (this.y <= 24) return 'n';
    if (this.y >= h - 22) return 's';
    if (this.x <= 24) return 'w';
    if (this.x >= w - 24) return 'e';

    const edges = this.getWindowEdges();
    for (const r of edges) {
      if (this.x >= r.left - 12 && this.x <= r.right + 12) {
        if (Math.abs(this.y - r.top) <= 18) return 's';
        if (Math.abs(this.y - r.bottom) <= 18) return 'n';
      }
      if (this.y >= r.top - 12 && this.y <= r.bottom + 12) {
        if (Math.abs(this.x - r.left) <= 18) return 'e';
        if (Math.abs(this.x - r.right) <= 18) return 'w';
      }
    }
    return null;
  }

  updateProp() {
    if (!this.prop) return;
    const p = this.prop;
    const w = this.getScreenW();
    const h = this.getTaskbarTop() - 12;

    if (p.kind === 'fish') {
      this.targetX = p.x;
      this.targetY = p.y - 6;
      const d = Math.hypot(this.x - this.targetX, this.y - this.targetY);
      if (d <= 22) {
        this.state = 'eating';
        if (this.frame % 18 === 0) this.playSound('munch');
        p.biteTimer--;
        if (p.biteTimer <= 0) {
          this.prop = null;
          this.stats.fishEaten++;
          this.pet();
        }
      }
      return;
    }

    if (p.cooldown > 0) p.cooldown--;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;

    if (p.x < 18) { p.x = 18; p.vx = Math.abs(p.vx) * 0.85; }
    if (p.x > w - 18) { p.x = w - 18; p.vx = -Math.abs(p.vx) * 0.85; }
    if (p.y < 18) { p.y = 18; p.vy = Math.abs(p.vy) * 0.85; }
    if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) * 0.85; }

    if (p.kind === 'yarn') {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 9) p.trail.shift();
    }

    const anchor = this.getClippyAnchor();
    if (p.kind === 'paper_ball' && p.returningToClippy && anchor) {
      const distClippy = Math.hypot(p.x - anchor.x, p.y - anchor.y);
      if (distClippy < 42) {
        this.prop = null;
        this.state = 'sitting';
        this.idleTime = 0;
        if (window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
          window.clippySystem.onNekoEvent('paper_returned', this);
        }
        this.refreshBasketWindow();
        return;
      }
    }

    this.targetX = p.x;
    this.targetY = p.y;
    const distCat = Math.hypot(this.x - p.x, this.y - p.y);
    if (distCat < 24 && p.cooldown <= 0) {
      p.bats = (p.bats || 0) + 1;
      p.cooldown = 16;
      this.state = 'pouncing';
      this.stateTimer = 14;
      this.playSound('pounce');

      if (p.kind === 'paper_ball') {
        this.stats.paperBallsBatted++;
        if (p.bats >= p.maxBats && anchor) {
          const ang = Math.atan2(anchor.y - p.y, anchor.x - p.x);
          p.vx = Math.cos(ang) * 7.5;
          p.vy = Math.sin(ang) * 7.5;
          p.returningToClippy = true;
        } else if (p.bats > p.maxBats) {
          this.prop = null;
          this.state = 'sitting';
        } else {
          const ang = Math.atan2(p.y - this.y, p.x - this.x) + (Math.random() - 0.5) * 0.8;
          p.vx = Math.cos(ang) * 6.2;
          p.vy = Math.sin(ang) * 6.2;
        }
      } else if (p.kind === 'yarn') {
        this.stats.yarnBatted++;
        if (p.bats > p.maxBats) {
          this.prop = null;
          this.pet();
        } else {
          const ang = Math.atan2(p.y - this.y, p.x - this.x) + (Math.random() - 0.5) * 1.1;
          p.vx = Math.cos(ang) * 5.8;
          p.vy = Math.sin(ang) * 5.8;
          if (anchor && Math.hypot(p.x - anchor.x, p.y - anchor.y) < 130 && window.clippySystem && typeof window.clippySystem.onNekoEvent === 'function') {
            window.clippySystem.onNekoEvent('yarn', this);
          }
        }
      }
      this.refreshBasketWindow();
    }
  }

  updateDirectionFromAngle(angle) {
    const deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) this.direction = 'e';
    else if (deg >= 22.5 && deg < 67.5) this.direction = 'se';
    else if (deg >= 67.5 && deg < 112.5) this.direction = 's';
    else if (deg >= 112.5 && deg < 157.5) this.direction = 'sw';
    else if (deg >= 157.5 && deg < 202.5) this.direction = 'w';
    else if (deg >= 202.5 && deg < 247.5) this.direction = 'nw';
    else if (deg >= 247.5 && deg < 292.5) this.direction = 'n';
    else this.direction = 'ne';
  }

  update() {
    this.frame++;

    if (this.isDragging) {
      this.state = 'dragging';
      this.syncActorElement();
      return;
    }

    this.updateProp();

    if (this.settings.mode === 'wander' && !this.prop) {
      this.wanderTimer++;
      if (this.wanderTimer > 210 && Math.random() < 0.04) {
        this.wanderTimer = 0;
        this.pickWanderTarget();
      }
    } else if (this.settings.mode === 'clippy' && !this.prop) {
      const anchor = this.getClippyAnchor();
      if (anchor) {
        this.targetX = Math.max(24, anchor.left - 24);
        this.targetY = Math.min(this.getTaskbarTop() - 18, anchor.bottom - 14);
      }
    }

    if (this.state === 'eating') {
      this.syncActorElement();
      this.updateParticles();
      return;
    }

    if (this.state === 'purring' || this.state === 'pouncing' || this.state === 'alert') {
      if (this.stateTimer > 0) {
        this.stateTimer--;
        if (this.state === 'purring' && this.frame % 26 === 0) {
          this.spawnHeart(this.x + (Math.random() - 0.5) * 14, this.y - 16);
        }
        this.syncActorElement();
        this.updateParticles();
        return;
      }
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const stopRadius = this.prop ? 18 : 34;

    if (dist > stopRadius && Date.now() >= this.sleepLockUntil) {
      this.state = 'running';
      this.idleTime = 0;
      const angle = Math.atan2(dy, dx);
      const stepSpeed = this.prop ? this.speed * 1.18 : this.speed;
      this.x += Math.cos(angle) * stepSpeed;
      this.y += Math.sin(angle) * stepSpeed;

      const w = this.getScreenW();
      const h = this.getTaskbarTop();
      this.x = Math.max(16, Math.min(w - 16, this.x));
      this.y = Math.max(16, Math.min(h - 14, this.y));

      this.updateDirectionFromAngle(angle);

      if (this.settings.pawprints && this.frame % 9 === 0) {
        this.pawprints.push({ x: this.x, y: this.y + 10, alpha: 0.38 });
        if (this.pawprints.length > 14) this.pawprints.shift();
      }
    } else {
      this.idleTime++;
      const edgeDir = this.detectNearbyEdge();

      if (this.idleTime > 200) {
        this.state = 'sleeping';
        if (this.frame % 38 === 0) {
          this.sleepZzz.push({ x: this.x + 8, y: this.y - 12, alpha: 1.0, size: 10 });
        }
      } else if (this.idleTime > 160) {
        this.state = 'yawning';
      } else if (this.idleTime > 105) {
        if (edgeDir) {
          this.state = 'scratching';
          this.scratchDir = edgeDir;
        } else {
          this.state = 'itching';
        }
      } else if (this.idleTime > 50) {
        if (edgeDir && this.idleTime < 85) {
          this.state = 'scratching';
          this.scratchDir = edgeDir;
        } else {
          this.state = 'washing';
        }
      } else {
        this.state = 'sitting';
      }
    }

    this.updateParticles();
    this.syncActorElement();

    if (this.frame % 30 === 0) {
      this.updateTrayTooltip();
      this.refreshBasketWindow();
      if (window.clippySystem && typeof window.clippySystem.checkNeko === 'function') {
        window.clippySystem.checkNeko();
      }
    }
  }

  updateParticles() {
    for (let i = this.sleepZzz.length - 1; i >= 0; i--) {
      const z = this.sleepZzz[i];
      z.y -= 0.55;
      z.x += 0.28;
      z.alpha -= 0.015;
      if (z.alpha <= 0) {
        this.sleepZzz.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.022;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.pawprints.length - 1; i >= 0; i--) {
      const pw = this.pawprints[i];
      pw.alpha -= 0.006;
      if (pw.alpha <= 0) {
        this.pawprints.splice(i, 1);
      }
    }
  }

  getSpriteFrame() {
    const step2 = (div) => (Math.floor(this.frame / div) % 2) + 1;
    const isWest = this.direction === 'w' || this.direction === 'nw' || this.direction === 'sw';

    if (this.state === 'dragging') {
      const f = this.mouseVelX < -1.5 ? 'drag_1' : (this.mouseVelX > 1.5 ? 'drag_2' : `drag_${step2(8)}`);
      return { frameKey: f, flipX: false };
    }
    if (this.state === 'sleeping') {
      return { frameKey: `sleep_${step2(28)}`, flipX: false };
    }
    if (this.state === 'alert') {
      return { frameKey: `alert_${step2(6)}`, flipX: false };
    }
    if (this.state === 'yawning') {
      return { frameKey: `yawn_${step2(14)}`, flipX: false };
    }
    if (this.state === 'washing') {
      return { frameKey: `wash_${step2(9)}`, flipX: false };
    }
    if (this.state === 'itching') {
      return { frameKey: `itch_${step2(5)}`, flipX: false };
    }
    if (this.state === 'purring') {
      return { frameKey: `purr_${step2(9)}`, flipX: false };
    }
    if (this.state === 'pouncing') {
      return { frameKey: `pounce_${step2(6)}`, flipX: isWest };
    }
    if (this.state === 'eating') {
      return { frameKey: `eat_${step2(7)}`, flipX: isWest };
    }
    if (this.state === 'scratching') {
      const sd = this.scratchDir || this.direction;
      const s = step2(6);
      if (sd === 'n' || sd === 'ne' || sd === 'nw') return { frameKey: `scratch_n_${s}`, flipX: false };
      if (sd === 's') return { frameKey: `scratch_s_${s}`, flipX: false };
      if (sd === 'w' || sd === 'sw') return { frameKey: `scratch_e_${s}`, flipX: true };
      return { frameKey: `scratch_e_${s}`, flipX: false };
    }
    if (this.state === 'running') {
      const s = step2(5);
      switch (this.direction) {
        case 'n': return { frameKey: `run_n_${s}`, flipX: false };
        case 's': return { frameKey: `run_s_${s}`, flipX: false };
        case 'e': return { frameKey: `run_e_${s}`, flipX: false };
        case 'w': return { frameKey: `run_e_${s}`, flipX: true };
        case 'se': return { frameKey: `run_se_${s}`, flipX: false };
        case 'sw': return { frameKey: `run_se_${s}`, flipX: true };
        case 'ne': return { frameKey: `run_ne_${s}`, flipX: false };
        case 'nw': return { frameKey: `run_ne_${s}`, flipX: true };
        default: return { frameKey: `run_s_${s}`, flipX: false };
      }
    }
    if (this.frame % 96 >= 90) {
      return { frameKey: 'sit_blink', flipX: false };
    }
    return { frameKey: `sit_${step2(24)}`, flipX: false };
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const pw of this.pawprints) {
      this.ctx.fillStyle = `rgba(30, 41, 59, ${pw.alpha.toFixed(2)})`;
      this.ctx.fillRect(Math.round(pw.x - 3), Math.round(pw.y), 2, 2);
      this.ctx.fillRect(Math.round(pw.x + 1), Math.round(pw.y + 1), 2, 2);
    }

    if (this.prop) {
      this.drawProp(this.ctx, this.prop);
    }

    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const { frameKey, flipX } = this.getSpriteFrame();
    this.drawCatFrame(this.ctx, frameKey, px, py, this.spriteSize, flipX, this.getCurrentCoat());

    if (this.isClawd() && (this.state === 'washing' || this.state === 'itching')) {
      this.drawClawdThought(this.ctx, px, py);
    }

    this.sleepZzz.forEach(z => {
      this.ctx.fillStyle = `rgba(0, 0, 128, ${z.alpha})`;
      this.ctx.font = 'bold 11px Tahoma, monospace';
      this.ctx.fillText('Zzz', Math.round(z.x), Math.round(z.y));
    });

    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
      this.ctx.fillStyle = pt.color || '#e11d48';
      this.ctx.font = 'bold 12px Tahoma, sans-serif';
      this.ctx.fillText(pt.symbol || '♥', Math.round(pt.x), Math.round(pt.y));
      this.ctx.restore();
    });
  }

  drawProp(ctx, p) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    ctx.save();

    if (p.kind === 'yarn') {
      if (Array.isArray(p.trail) && p.trail.length > 1) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(p.trail[0].x), Math.round(p.trail[0].y + 4));
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(Math.round(p.trail[i].x), Math.round(p.trail[i].y + 4));
        }
        ctx.lineTo(x, y + 4);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(x - 5, y + 5, 10, 2);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x - 3, y - 4, 4, 2);
      ctx.fillRect(x - 4, y - 1, 8, 1);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x - 4, y + 2, 8, 1);
      ctx.fillRect(x + 1, y - 4, 1, 8);
    } else if (p.kind === 'paper_ball') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x - 5, y + 5, 10, 2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 6, y - 5, 12, 10);
      ctx.fillRect(x - 5, y - 6, 10, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 5, y - 4, 10, 8);
      ctx.fillRect(x - 4, y - 5, 8, 10);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(x - 4, y - 2, 8, 1);
      ctx.fillRect(x - 3, y + 1, 7, 1);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 2, y - 3, 2, 3);
      ctx.fillRect(x + 1, y, 2, 3);
    } else if (p.kind === 'fish') {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - 10, y + 2, 20, 6);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x - 8, y + 3, 16, 4);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x - 7, y - 3, 14, 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x - 6, y - 2, 10, 4);
      ctx.fillRect(x + 5, y - 3, 3, 2);
      ctx.fillRect(x + 5, y + 1, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 4, y - 1, 2, 2);
    }

    ctx.restore();
  }

  drawClawdThought(ctx, cx, cy) {
    const glyphs = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];
    const words = this.isRu()
      ? ['Размышляю…', 'Кумекаю…', 'Прикидываю…', 'Соображаю…', 'Колдую…']
      : ['Pondering…', 'Noodling…', 'Clauding…', 'Musing…', 'Percolating…'];
    const glyph = glyphs[Math.floor(this.frame / 6) % glyphs.length];
    const word = words[Math.floor(this.frame / 240) % words.length];
    ctx.save();
    ctx.font = '10px Tahoma, sans-serif';
    const textW = Math.ceil(ctx.measureText(word).width);
    const boxW = textW + 18;
    const left = Math.round(Math.max(2, Math.min(this.getScreenW() - boxW - 2, cx - boxW / 2)));
    const top = Math.max(2, cy - 26);
    ctx.fillStyle = '#000000';
    ctx.fillRect(left, top, boxW, 15);
    ctx.fillStyle = '#ffffe1';
    ctx.fillRect(left + 1, top + 1, boxW - 2, 13);
    ctx.fillStyle = '#d97757';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillText(glyph, left + 4, top + 11);
    ctx.fillStyle = '#000000';
    ctx.font = '10px Tahoma, sans-serif';
    ctx.fillText(word, left + 14, top + 11);
    ctx.restore();
  }

  drawCatFrame(ctx, frameKey, cx, cy, size, flipX, coat) {
    const frames = coat && coat.frames === 'clawd' ? this.clawdFrames : this.compiledFrames;
    const runs = frames[frameKey] || frames.sit_1;
    const pal = (coat && coat.palette) ? coat.palette : this.getCoats().white.palette;
    const isScribble = coat && coat.id === 'scribble';

    ctx.save();
    ctx.translate(Math.round(cx - size * 0.5), Math.round(cy - size * 0.5));
    if (flipX) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    const scale = size / 32;
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(7, 29, 18, 2);

    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (isScribble && (r.ch === 'b' || r.ch === 'w') && r.y % 4 === 0) {
        ctx.fillStyle = '#93c5fd';
      } else {
        ctx.fillStyle = pal[r.ch] || '#ffffff';
      }
      ctx.fillRect(r.x, r.y, r.w, 1);
    }

    ctx.restore();
  }

  compileFrames(rawMap) {
    const compiled = {};
    Object.keys(rawMap).forEach(key => {
      const rows = rawMap[key];
      const runs = [];
      for (let y = 0; y < rows.length && y < 32; y++) {
        const row = rows[y];
        let x = 0;
        while (x < row.length && x < 32) {
          const ch = row[x];
          let end = x + 1;
          while (end < row.length && end < 32 && row[end] === ch) end++;
          if (ch !== '.' && ch !== ' ') {
            runs.push({ ch, x, y, w: end - x });
          }
          x = end;
        }
      }
      compiled[key] = runs;
    });
    return compiled;
  }

  getRawFrames() {
    const baseSit1 = [
      '................................',
      '.......kk..............kk.......',
      '......kbbk............kbbk......',
      '.....kbeebk..........kbeebk.....',
      '.....kbeeebk........kbeeebk.....',
      '....kbeeeebk.kkkkkk.kbeeeebk....',
      '....kbeeeebbkkbbbbbbkkbbeeeebk..',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbbbbbbssbbssbbbbbbbbbk...',
      '...kbbbbkkkbbbbbbbbbbkkkbbbbk...',
      '...kbbbkgyykbbbbbbbbkgyykbbbk...',
      '..kbbbbkkkkbbbbbbbbbbkkkkbbbbk..',
      '..kbbbbbbbbbbbbnnbbbbbbbbbbbbk..',
      '.kkkbbbbbbbbbbnnnnbbbbbbbbbbkkk.',
      '...kbbbbppbbbbkkkkbbbbppbbbbk...',
      '.kkkbbbbbbbbkwwkkwwkbbbbbbbbkkk.',
      '....kbbbbbbbbwwwwwwbbbbbbbbk....',
      '.....kbbbbbbbwwwwwwbbbbbbbk..kk.',
      '......kkcccccccccccccccckk..kbbk',
      '......kcccccccccccccccccck..kbbk',
      '......kbbbbbbkzzzzkbbbbbbk.kbbk.',
      '.....kbbbbbbbkzzzzkbbbbbbbkkbbk.',
      '.....kbbbbbbbbkkkkbbbbbbbbkbbk..',
      '.....kbbbbbsbbbbbbbbsbbbbbbbk...',
      '.....kbbbbwwbbbbbbbbwwbbbbbk....',
      '.....kbbbbkwbbbbbbbbwkbbbbk.....',
      '.....kbbbbkwbbbbbbbbwkbbbbk.....',
      '.....kbbbbkwkkkkkkkkwkbbbbk.....',
      '....kbbbbbkkwwk..kwwkkbbbbbk....',
      '....kkkkkkkkwwk..kwwkkkkkkkk....',
      '..........kkkk....kkkk..........',
      '................................'
    ];

    const baseSit2 = baseSit1.slice();
    baseSit2[17] = '.....kbbbbbbbwwwwwwbbbbbbbk.kk..';
    baseSit2[18] = '......kkcccccccccccccccckk.kbbk.';
    baseSit2[19] = '......kcccccccccccccccccck.kbbk.';
    baseSit2[20] = '......kbbbbbbkzzzzkbbbbbbk.kbbk.';

    const baseSitBlink = baseSit1.slice();
    baseSitBlink[9] = '...kbbbbbbbbbbbbbbbbbbbbbbbbk...';
    baseSitBlink[10] = '...kbbbkkkkkbbbbbbbbkkkkkbbbk...';
    baseSitBlink[11] = '..kbbbbbbbbbbbbbbbbbbbbbbbbbbk..';

    const alert1 = [
      '...............rr...............',
      '..............rrrr..............',
      '..............rrrr..............',
      '...............rr...............',
      '.......kk......rr......kk.......',
      '......kbbk............kbbk......',
      '.....kbeebk..kkkkkk..kbeebk.....',
      '....kbeeebkkbbbbbbbbkkbeeebk....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbkkkbbbbbbbbbbkkkbbbbk...',
      '...kbbbkgyykbbbbbbbbkgyykbbbk...',
      '...kbbbkyyykbbbbbbbbkyyykbbbk...',
      '...kbbbbkkkbbbbnnbbbbkkkbbbbk...',
      '..kkkbbbbbbbbbnnnnbbbbbbbbbkkk..',
      '....kbbbbppbbbbkkbbbbppbbbbk....',
      '.....kbbbbbbccccccccbbbbbbk.kk..',
      '.....kbbbbbbkzzzzzzkbbbbbbkkbbk.',
      '....kbbbbbbbbkzzzzkbbbbbbbbkbbk.',
      '....kbbbbssbbbbkkbbbbssbbbbkbbk.',
      '....kbbbbbbbbwwwwwwbbbbbbbbkbbk.',
      '....kbbbbbbbbwwwwwwbbbbbbbbkbbk.',
      '....kbbbbbbkkkkkkkkkkbbbbbbkbbk.',
      '....kbbbbbkwk......kwkbbbbbkbbk.',
      '....kbbbbbkwk......kwkbbbbkbbk..',
      '....kbbbbbkwk......kwkbbbbkbbk..',
      '....kbbbbbkwk......kwkbbbbkkk...',
      '....kwwwwwkwk......kwkwwwwwk....',
      '....kkkkkkkkk......kkkkkkkkk....',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const alert2 = alert1.slice();
    alert2[0] = '................................';
    alert2[3] = '...............rr...............';

    const runS1 = [
      '................................',
      '...............kk...............',
      '..............kbbk..............',
      '.......kk.....kbbk.....kk.......',
      '......kbbk....kbbk....kbbk......',
      '.....kbeebk..kbbbbk..kbeebk.....',
      '.....kbeeebkkbbbbbbkkbeeebk.....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbkkkbbbbbbbbbbkkkbbbbk...',
      '...kbbbkgyykbbbbbbbbkgyykbbbk...',
      '..kbbbbkkkkbbbbnnbbbbkkkkbbbbk..',
      '.kkkbbbbbbbbbbnnnnbbbbbbbbbbkkk.',
      '...kbbbbppbbbbkkkkbbbbppbbbbk...',
      '....kbbbbbbbbwwwwwwbbbbbbbbk....',
      '.....kkcccccccccccccccccckk.....',
      '.....kbbbbbbbkzzzzkbbbbbbbk.....',
      '....kbbbbbsbbkzzzzkbbsbbbbbk....',
      '....kbbbbbbbbwwwwwwbbbbbbbbk....',
      '...kbbbbbwwbbwwwwwwbbppbbbbbk...',
      '...kbbbbkwwkkbbbbbbkkbbbbbbbk...',
      '...kbbbbkwwk.kkkkkk..kbbbbbbk...',
      '....kkkkkwwk.........kbbbbwk....',
      '........kkkk.........kbbbbwk....',
      '.....................kwwwwk.....',
      '.....................kkkkkk.....',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runS2 = [
      '................................',
      '................kk..............',
      '...............kbbk.............',
      '.......kk.....kbbk.....kk.......',
      '......kbbk....kbbk....kbbk......',
      '.....kbeebk..kbbbbk..kbeebk.....',
      '.....kbeeebkkbbbbbbkkbeeebk.....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbkkkbbbbbbbbbbkkkbbbbk...',
      '...kbbbkgyykbbbbbbbbkgyykbbbk...',
      '..kbbbbkkkkbbbbnnbbbbkkkkbbbbk..',
      '.kkkbbbbbbbbbbnnnnbbbbbbbbbbkkk.',
      '...kbbbbppbbbbkkkkbbbbppbbbbk...',
      '....kbbbbbbbbwwwwwwbbbbbbbbk....',
      '.....kkcccccccccccccccccckk.....',
      '.....kbbbbbbbkzzzzkbbbbbbbk.....',
      '....kbbbbbsbbkzzzzkbbsbbbbbk....',
      '....kbbbbbbbbwwwwwwbbbbbbbbk....',
      '...kbbbbbppbbwwwwwwbbwwbbbbbk...',
      '...kbbbbbbbkkbbbbbbkkwwkbbbbk...',
      '...kbbbbbbk..kkkkkk.kwwkbbbbk...',
      '....kwbbbbk.........kwwkkkkk....',
      '....kwbbbbk.........kkkk........',
      '.....kwwwwk.....................',
      '.....kkkkkk.....................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runN1 = [
      '................................',
      '.......kk..............kk.......',
      '......kbbk............kbbk......',
      '.....kbbbbk..kkkkkk..kbbbbk.....',
      '....kbbbbbbkkbbbbbbkkbbbbbbk....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbbbbbbssbbssbbbbbbbbbk...',
      '...kbbbbbbbbbbbbbbbbbbbbbbbbk...',
      '....kbbbbbbbbbbbbbbbbbbbbbbk....',
      '.....kkcccccccccccccccccckk.....',
      '.....kbbbbbbbbbbbbbbbbbbbbk.....',
      '....kbbbbssbbbbbbbbbbppbbbbk....',
      '....kbbbbssbbbbbbbbbbppbbbbk....',
      '...kbbbbbbbbbbbbbbbbbbbbbbbbk...',
      '...kbbbbbbbbbbbkkbbbbbbbbbbbk...',
      '...kbbbbbbbbbbkbbkbbbbbbbbbbk...',
      '...kbbbbbbbbbbkbbkbbbbbbbbbbk...',
      '...kbbbbbbbbbkbbbbkbbbbbbbbbk...',
      '....kbbbbbbbbkbbbbkbbbbbbbbk....',
      '....kwwbbbkkk.kbbk.kkkbbbbk.....',
      '....kwwkkk....kbbk....kbbwk.....',
      '....kkk......kbbk.....kwwwk.....',
      '.............kbbk.....kkkkk.....',
      '.............kbbk...............',
      '..............kk................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runN2 = [
      '................................',
      '.......kk..............kk.......',
      '......kbbk............kbbk......',
      '.....kbbbbk..kkkkkk..kbbbbk.....',
      '....kbbbbbbkkbbbbbbkkbbbbbbk....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbbbbbbssbbssbbbbbbbbbk...',
      '...kbbbbbbbbbbbbbbbbbbbbbbbbk...',
      '....kbbbbbbbbbbbbbbbbbbbbbbk....',
      '.....kkcccccccccccccccccckk.....',
      '.....kbbbbbbbbbbbbbbbbbbbbk.....',
      '....kbbbbppbbbbbbbbbbssbbbbk....',
      '....kbbbbppbbbbbbbbbbssbbbbk....',
      '...kbbbbbbbbbbbbbbbbbbbbbbbbk...',
      '...kbbbbbbbbbbbkkbbbbbbbbbbbk...',
      '...kbbbbbbbbbbkbbkbbbbbbbbbbk...',
      '...kbbbbbbbbbbkbbkbbbbbbbbbbk...',
      '...kbbbbbbbbbkbbbbkbbbbbbbbbk...',
      '....kbbbbbbbbkbbbbkbbbbbbbbk....',
      '.....kbbbbkkk.kbbk.kkkbbbwwk....',
      '.....kwbbk....kbbk....kkkwwk....',
      '.....kwwwk.....kbbk......kkk....',
      '.....kkkkk.....kbbk.............',
      '...............kbbk.............',
      '................kk..............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runE1 = [
      '................................',
      '................................',
      '....................kk...kk.....',
      '...................kbbk.kbbk....',
      '..................kbeebkbeebk...',
      '.................kbbbbbbbbbbk...',
      '................kbbbbbbbbkgyyk..',
      '..kkkk.........kbbbbbbbbbbkkkk..',
      '.kbbbbkk.......kbbbbbbbbbbbbnnk.',
      'kbbbbbbskkkkkkkbbbbbbbbbbbbbbkk.',
      '.kkkkbbbbbbssbbbbbbppbbcccccck..',
      '.....kbbbbbbbssbbbbppbbcccccczk.',
      '.....kbbbbbbbbbbbbbbbbbbbbbbzzk.',
      '....kbbbbbbbbbbbbbbbbbbbbbbbwk..',
      '...kbbbbbbbbwwwwwwwwbbbbbbbbk...',
      '..kbbbbkkk..kkkkkkkk..kkkbbbbk..',
      '.kbbbkk..................kkbbwk.',
      'kwwkk......................kkwwk',
      'kkk..........................kkk',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runE2 = [
      '................................',
      '................................',
      '...................kk...kk......',
      '....kk............kbbk.kbbk.....',
      '...kbbk..........kbeebkbeebk....',
      '..kbbk..........kbbbbbbbbbbk....',
      '..kbbk.........kbbbbbbbbkgyyk...',
      '...kbbk..kkkkkkbbbbbbbbbbkkkk...',
      '...kbbkkkbbbbssbbbbbbbbbbbbnnk..',
      '....kbbbbbbbbssbbbbppbbcccccckk.',
      '.....kbbbbbbbbbbbbbppbbcccccczk.',
      '.....kbbbbbbbbbbbbbbbbbbbbbbzzk.',
      '.....kbbbbbbbbwwwwwwbbbbbbbbwk..',
      '......kbbbbbbbwwwwwwbbbbbbbbk...',
      '.......kbbbbbbkkkkkkbbbbbbbk....',
      '........kbbbbkwk..kwkbbbbbk.....',
      '.........kbbbkwk..kwkbbbbk......',
      '.........kwwwkwk..kwkwwwk.......',
      '.........kkkkkkk..kkkkkkk.......',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runSE1 = [
      '................................',
      '................................',
      '.............kk........kk.......',
      '...kk.......kbbk......kbbk......',
      '..kbbk.....kbeebk.kk.kbeebk.....',
      '..kbbk....kbeeebkkbbkkbeeebk....',
      '...kbbk...kbbbbbbssbbbbbbbbk....',
      '...kbbk..kbbbbkkkbbbbbbkkkbbk...',
      '....kbbkkbbbbkgyykbbbbkgyykbbk..',
      '....kbbbbbbbbbkkkbbbbbbkkkbbbk..',
      '.....kbbbbbbbbbbbbbbnnnnbbbbbk..',
      '.....kbbbbssbbbbbbbbkkkkbbbbk...',
      '.....kbbbbssbbbcccccccccccccck..',
      '.....kbbbbbbbbbcccccccccccccck..',
      '.....kbbbbbbbbbbbbbzzzzbbbbbk...',
      '......kbbbbbbwwwwwwzzzzbbbbk....',
      '......kbbbbbbwwwwwwwwbbbbbbk....',
      '.....kbbbbkkkbbbbbbbbkkkbbbbk...',
      '....kbbbkk...kkkkkkkk...kkbbwk..',
      '....kwwk..................kwwk..',
      '....kkkk..................kkkk..',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runSE2 = runSE1.slice();
    runSE2[17] = '......kbbbbbbkkkkkkkkbbbbbbk....';
    runSE2[18] = '.......kbbbbkwk....kwkbbbbk.....';
    runSE2[19] = '........kwwwkwk....kwkwwwk......';
    runSE2[20] = '........kkkkkkk....kkkkkkk......';

    const runNE1 = [
      '................................',
      '..............kk........kk......',
      '.............kbbk......kbbk.....',
      '............kbbbbk.kk.kbbbbk....',
      '...........kbbbbbbkbbkbbbbbbk...',
      '...........kbbbbbbssbbbbbbbbk...',
      '..........kbbbbbbbssbbbbbbbbbk..',
      '..........kbbbbbbbbbbbbbbkgyyk..',
      '...........kbbbbbbbbbbbbbbkkkk..',
      '...........kkccccccccccccccbbk..',
      '..........kbbbbbbbbbbbbbbbbbk...',
      '.........kbbbbssbbbbbbppbbbbk...',
      '........kbbbbbssbbbbbbppbbbbk...',
      '.......kbbbbbbbbbbbbbbbbbbbbk...',
      '......kbbbbbbbbbbbbbbbbbbbbk....',
      '.....kbbbbbbbbbbbbbbbbbbbbk.....',
      '....kbbbkbbbbbbbbbbbbbbkbbwk....',
      '...kbbk..kbbbbk..kbbbbk.kwwk....',
      '..kbbk...kwwwk....kwwwk..kkk....',
      '..kkk....kkkkk....kkkkk.........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const runNE2 = runNE1.slice();
    runNE2[16] = '.....kbbbbbbbbbbbbbbbbbbbbwk....';
    runNE2[17] = '....kbbk..kwwwk....kwwwk.kwwk...';
    runNE2[18] = '...kbbk...kkkkk....kkkkk..kkk...';
    runNE2[19] = '...kkk..........................';

    const scratchN1 = [
      '......w..w............w..w......',
      '......w..w............w..w......',
      '.....kwkkwk..........kwkkwk.....',
      '.....kwwwwk..........kwwwwk.....',
      '.....kbbbbk..kk..kk..kbbbbk.....',
      '......kbbbbkkbbkkbbkkbbbbk......',
      '......kbbbbbbbbbbbbbbbbbbk......',
      '......kbbbbbbbssbbssbbbbbk......',
      '.......kbbbbbbssbbssbbbbk.......',
      '.......kkcccccccccccccckk.......',
      '.......kbbbbbbbbbbbbbbbbk.......',
      '......kbbbbssbbbbbbppbbbbk......',
      '......kbbbbssbbbbbbppbbbbk......',
      '......kbbbbbbbbbbbbbbbbbbk......',
      '......kbbbbbbbbbbbbbbbbbbk......',
      '......kbbbbbbbbkkkkkkkkbbk......',
      '......kbbbbbbbkbbbbbbbbkbk......',
      '.......kbbbbbbkbbk..kbbkkk......',
      '.......kbbbbbbkbbk..............',
      '.......kbbbbwk.kbbk.............',
      '.......kwwwwk..kbbk.............',
      '.......kkkkkk...kk..............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const scratchN2 = scratchN1.slice();
    scratchN2[0] = '........w..w........w..w........';
    scratchN2[1] = '.....kwkkwk..........kwkkwk.....';
    scratchN2[2] = '.....kwwwwk..........kwwwwk.....';
    scratchN2[3] = '.....kbbbbk..........kbbbbk.....';
    scratchN2[19] = '.......kbbbbwk..kbbk............';

    const scratchS1 = baseSit1.slice();
    scratchS1[25] = '....kwkkwkbbbbbbbbbbbbkwkkwk....';
    scratchS1[26] = '....kwwwwkbbbbbbbbbbbbkwwwwk....';
    scratchS1[27] = '....kwwwwkkkkkkkkkkkkkkwwwwk....';
    scratchS1[28] = '....w..w..kkkk....kkkk..w..w....';
    scratchS1[29] = '....w..w................w..w....';

    const scratchS2 = baseSit2.slice();
    scratchS2[25] = '.....kbbbbkwkkwkbbbbkwkkwkbbk...';
    scratchS2[26] = '.....kbbbbkwwwwkbbbbkwwwwkbbk...';
    scratchS2[27] = '.....kkkkkkwwwwkkkkkkwwwwkkkk...';
    scratchS2[28] = '..........w..w......w..w........';
    scratchS2[29] = '..........w..w......w..w........';

    const scratchE1 = [
      '................................',
      '..............kk...kk...........',
      '.............kbbk.kbbk..........',
      '............kbeebkbeebk....w.w..',
      '...........kbbbbbbbbbbk...kwkwk.',
      '..........kbbbbbbbbkgyyk..kwwwk.',
      '..........kbbbbbbbbbbkkkkkbbbbk.',
      '..........kbbbbbbbbbbbbnnbbbbk..',
      '..........kbbbbbbcccccccccccck..',
      '.........kbbbbbbbcccccccccccck..',
      '.........kbbbbssbbbbbbbbzzzzk...',
      '.........kbbbbssbbbbbbbbbwkk....',
      '.........kbbbbbbbbbbbbbbbwk.w.w.',
      '.........kbbbbppbbbbbbbbbkkkwkwk',
      '.........kbbbbppbbbbbbbbk..kwwwk',
      '....kk....kbbbbbbbbbbbbk...kkkk.',
      '...kbbk...kbbbbbbbbbbbk.........',
      '...kbbk....kbbbbbbbwk...........',
      '....kbbkkkkkbbbbbbbwk...........',
      '.....kbbbbbbbbbkkkkkk...........',
      '......kkkkkkkkk.................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const scratchE2 = scratchE1.slice();
    scratchE2[3] = '............kbeebkbeebk.........';
    scratchE2[4] = '...........kbbbbbbbbbbk....w.w..';
    scratchE2[5] = '..........kbbbbbbbbkgyyk..kwkwk.';
    scratchE2[6] = '..........kbbbbbbbbbbkkkkkwwwwk.';
    scratchE2[12] = '.........kbbbbbbbbbbbbbbbbkkkk..';
    scratchE2[13] = '.........kbbbbppbbbbbbbbbk.w.w..';

    const wash1 = baseSit1.slice();
    wash1[10] = '...kbbbkgyykbbbbbbbbkkkkkbbbk...';
    wash1[13] = '.kkkbbbbbbbbbbnnnnrrbbbbbbbbkkk.';
    wash1[14] = '...kbbbbppbbbbkkkkrrkwwwbbbbk...';
    wash1[15] = '.kkkbbbbbbbbkwwkkwwkkwwwbbbbkkk.';
    wash1[16] = '....kbbbbbbbbwwwwwwkwwwbbbbk....';

    const wash2 = baseSit2.slice();
    wash2[9] = '...kbbbbkkkbbbbbbbbbbkkkkbbbbk..';
    wash2[10] = '...kbbbkgyykbbbbbbbbkkkkkbbbk...';
    wash2[11] = '..kbbbbkkkkbbbbbbbbbbkwwwbbbbk..';
    wash2[12] = '..kbbbbbbbbbbbbnnbbbbkwwwbbbbk..';
    wash2[13] = '.kkkbbbbbbbbbbnnnnbbbkwwwbbbkkk.';

    const itch1 = baseSit1.slice();
    itch1[9] = '...kbbbbkkkbbbbbbbbbbkkkkbbbbk..';
    itch1[10] = '...kbbbkgyykbbbbbbbbkkkkkbbbk...';
    itch1[21] = '.....kbbbbbbbkzzzzkbbbbbbbkwwk..';
    itch1[22] = '.....kbbbbbbbbkkkkbbbbbbbkwwwk..';
    itch1[23] = '.....kbbbbbsbbbbbbbbsbbbbkwwk...';

    const itch2 = baseSit2.slice();
    itch2[10] = '...kbbbkgyykbbbbbbbbkkkkkbbbk...';
    itch2[18] = '......kkcccccccccccccccckk.kwwk.';
    itch2[19] = '......kcccccccccccccccccckkwwwk.';
    itch2[20] = '......kbbbbbbkzzzzkbbbbbbk.kwwk.';

    const yawn1 = baseSit1.slice();
    yawn1[9] = '...kbbbbbbbbbbbbbbbbbbbbbbbbk...';
    yawn1[10] = '...kbbbkkkkkbbbbbbbbkkkkkbbbk...';
    yawn1[13] = '.kkkbbbbbbbbbbrrrrrrbbbbbbbbkkk.';
    yawn1[14] = '...kbbbbppbbbbrrrrrrbbbbppbbk...';
    yawn1[15] = '.kkkbbbbbbbbkbrrrrrrbkbbbbbbkkk.';
    yawn1[16] = '....kbbbbbbbbkkkkkkkkbbbbbbk....';

    const yawn2 = yawn1.slice();
    yawn2[14] = '...kbbbbppbbbbrrrrrrbbbbppbbk...';
    yawn2[15] = '.kkkbbbbbbbbbbkkkkkkbbbbbbbbkkk.';

    const sleep1 = [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '........kk........kk............',
      '.......kbbk......kbbk...........',
      '......kbeebk.kk.kbeebk..........',
      '.....kbeeebkkbbkkbeeebk.........',
      '.....kbbbbbbssbbbbbbbbkkkkkk....',
      '....kbbbbbbbbssbbbbbbbssbbbbk...',
      '....kbbbkkkkbbbbkkkkbbssbbbbbk..',
      '...kbbbbbbbbbbbbbbbbbbbbppbbbbk.',
      '...kbbbbbbbbnnbbbbbbbbbbppbbbbk.',
      '...kbbbbbbbccccccccccbbbbbbbbbk.',
      '...kbbbbbbbbkzzkbbbbbbbbbbbbbbk.',
      '....kbbbbbbbkzzkbbbbbbbbbbbbbbk.',
      '....kbbbbwwwwwwwwbbbbbbbbbbbbk..',
      '.....kbbbwwwwwwwwbbbbkkkbbbbk...',
      '......kkkkkkkkkkkkkkkkbbbbbk....',
      '....................kkkkkkk.....',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const sleep2 = sleep1.slice();
    sleep2[14] = '.....kbeeebkkbbkkbeeebkkkkkk....';
    sleep2[15] = '....kbbbbbbbssbbbbbbbbssbbbbk...';

    const drag1 = [
      '.......kk..............kk.......',
      '......kbbk............kbbk......',
      '.....kbeebk..kkkkkk..kbeebk.....',
      '....kbeeebkkbbbbbbbbkkbeeebk....',
      '....kbbbbbbbbssbbssbbbbbbbbk....',
      '...kbbbbkkkbbbbbbbbbbkkkbbbbk...',
      '...kbbbkgyykbbbbbbbbkgyykbbbk...',
      '...kbbbkyyykbbbbbbbbkyyykbbbk...',
      '...kbbbbkkkbbbbnnbbbbkkkbbbbk...',
      '..kkkbbbbbbbbbnnnnbbbbbbbbbkkk..',
      '....kbbbbppbbbbkkbbbbppbbbbk....',
      '.....kkcccccccccccccccccckk.....',
      '.....kbbbbbbbkzzzzkbbbbbbbk.....',
      '.....kbbbbbbbkzzzzkbbbbbbbk.....',
      '....kbbbbwkbbbbkkbbbbkwbbbbk....',
      '....kwwwwkbbbbwwwwbbbbkwwwwk....',
      '....kkkkk.kbbbwwwwbbbk.kkkkk....',
      '..........kbbbbwwwwbbk..........',
      '..........kbbbssbbppbk..........',
      '..........kbbbssbbppbk..........',
      '..........kbbbbbbbbbbk..........',
      '.........kbbbbkkkkbbbbk.........',
      '........kbbbkwk..kwkbbbk........',
      '........kwwkkwk..kwkkwwk........',
      '........kkkk.kbbk.kkkkkk........',
      '............kbbk................',
      '............kbbk................',
      '.............kk.................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const drag2 = drag1.slice();
    drag2[22] = '.........kbbbkwk..kwkbbbk.......';
    drag2[23] = '.........kwwkkwk..kwkkwwk.......';
    drag2[24] = '.........kkkk.kbbk.kkkkkk.......';
    drag2[25] = '...............kbbk.............';
    drag2[26] = '...............kbbk.............';
    drag2[27] = '................kk..............';

    const purr1 = baseSit1.slice();
    purr1[9] = '...kbbbb..kbbbbbbbbbb..kbbbbk...';
    purr1[10] = '...kbbbkk.kkbbbbbbbbkk.kkbbbk...';
    purr1[11] = '..kbbbbk...kbbbbbbbbk...kbbbbk..';
    purr1[14] = '...kbbbbeeebbbbkkkkbbbbeeeebk...';

    const purr2 = baseSit2.slice();
    purr2[9] = '...kbbbb..kbbbbbbbbbb..kbbbbk...';
    purr2[10] = '...kbbbkk.kkbbbbbbbbkk.kkbbbk...';
    purr2[11] = '..kbbbbk...kbbbbbbbbk...kbbbbk..';
    purr2[14] = '...kbbbbeeebbbbkkkkbbbbeeeebk...';

    const pounce1 = runE2.slice();
    const pounce2 = runE1.slice();

    const eat1 = [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '....kk..........................'  ,
      '...kbbk..........kk......kk.....',
      '..kbbk..........kbbk....kbbk....',
      '..kbbk.........kbeebkkkkbeebk...',
      '...kbbk..kkkkkkbbbbbbbbbbbbbk...',
      '...kbbkkkbbbbssbbbbbbbbbbbbb....',
      '....kbbbbbbbbssbbbbppbbccccck...',
      '.....kbbbbbbbbbbbbbppbbccccczk..',
      '.....kbbbbbbbbbbbbbbbbbbkkkkk...',
      '.....kbbbbbbbbwwwwwwbbbbbbbbnk..',
      '......kbbbbbbbwwwwwwbbbbbbbbrrk.',
      '.......kbbbbbbkkkkkkbbbbkwwwkk..',
      '........kbbbbkwk..kwkbbbkwwwk...',
      '........kwwwwkwk..kwkwwwwkkkk...',
      '........kkkkkkk....kkkkkkkk.....',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ];

    const eat2 = eat1.slice();
    eat2[16] = '......kbbbbbbbwwwwwwbbbbbbbbnnk.';

    return {
      sit_1: baseSit1,
      sit_2: baseSit2,
      sit_blink: baseSitBlink,
      alert_1: alert1,
      alert_2: alert2,
      run_s_1: runS1,
      run_s_2: runS2,
      run_n_1: runN1,
      run_n_2: runN2,
      run_e_1: runE1,
      run_e_2: runE2,
      run_se_1: runSE1,
      run_se_2: runSE2,
      run_ne_1: runNE1,
      run_ne_2: runNE2,
      scratch_n_1: scratchN1,
      scratch_n_2: scratchN2,
      scratch_s_1: scratchS1,
      scratch_s_2: scratchS2,
      scratch_e_1: scratchE1,
      scratch_e_2: scratchE2,
      wash_1: wash1,
      wash_2: wash2,
      itch_1: itch1,
      itch_2: itch2,
      yawn_1: yawn1,
      yawn_2: yawn2,
      sleep_1: sleep1,
      sleep_2: sleep2,
      drag_1: drag1,
      drag_2: drag2,
      purr_1: purr1,
      purr_2: purr2,
      pounce_1: pounce1,
      pounce_2: pounce2,
      eat_1: eat1,
      eat_2: eat2
    };
  }

  getClawdRawFrames() {
    const sprite = (o = {}) => {
      const grid = Array.from({ length: 32 }, () => new Array(32).fill('.'));
      const rect = (x, y, w, h, ch) => {
        for (let yy = Math.max(0, y); yy < Math.min(32, y + h); yy++) {
          for (let xx = Math.max(0, x); xx < Math.min(32, x + w); xx++) grid[yy][xx] = ch;
        }
      };
      const height = o.height || 12;
      const top = 14 + (o.lift || 0) + (12 - height);
      const bottom = top + height - 1;
      const armY = top + Math.round(height * 0.5) + (o.armDy || 0);
      const eyeTop = top + 2;
      const look = o.look || 0;
      const legs = o.legs || [3, 3, 3, 3];
      const arms = o.arms || ['mid', 'mid'];

      rect(6, top, 20, height, 'b');
      rect(6, top, 20, 1, 'w');
      rect(6, bottom, 20, 1, 's');
      [8, 11, 19, 22].forEach((x, i) => rect(x, bottom + 1, 2, legs[i], 's'));

      arms.forEach((pose, i) => {
        const left = i === 0;
        if (pose === 'mid') rect(left ? 3 : 26, armY, 3, 3, 'b');
        else if (pose === 'up') rect(left ? 4 : 26, armY - 7, 2, 8, 'b');
        else if (pose === 'down') rect(left ? 4 : 26, armY + 1, 2, 5, 'b');
        else if (pose === 'out') rect(left ? 1 : 26, armY, 5, 2, 'b');
      });

      [10, 20].forEach((x0, i) => {
        const x = x0 + look;
        const eyes = o.eyes || 'open';
        if (eyes === 'open') rect(x, eyeTop, 2, 4, 'k');
        else if (eyes === 'wide') rect(x, eyeTop - 1, 2, 5, 'k');
        else if (eyes === 'closed') rect(x - 1, eyeTop + 2, 4, 1, 'k');
        else if (eyes === 'happy') {
          rect(x, eyeTop + 1, 2, 1, 'k');
          rect(x - 1, eyeTop + 2, 1, 1, 'k');
          rect(x + 2, eyeTop + 2, 1, 1, 'k');
        }
        if (o.blush) rect(i === 0 ? x - 3 : x + 3, eyeTop + 4, 2, 1, 'e');
      });

      if (o.mark) {
        rect(15, top - 10, 2, 4, 'r');
        rect(15, top - 5, 2, 2, 'r');
      }
      return grid.map(row => row.join(''));
    };

    const stepA = [3, 1, 3, 1];
    const stepB = [2, 4, 2, 4];
    return {
      sit_1: sprite(),
      sit_2: sprite({ armDy: 1 }),
      sit_blink: sprite({ eyes: 'closed' }),
      alert_1: sprite({ lift: -3, eyes: 'wide', arms: ['up', 'up'], mark: true }),
      alert_2: sprite({ lift: -1, eyes: 'wide', arms: ['up', 'up'], mark: true }),
      run_s_1: sprite({ legs: stepA }),
      run_s_2: sprite({ lift: -1, legs: stepB, armDy: 1 }),
      run_n_1: sprite({ eyes: 'none', legs: stepA }),
      run_n_2: sprite({ eyes: 'none', lift: -1, legs: stepB, armDy: 1 }),
      run_e_1: sprite({ look: 2, legs: stepA }),
      run_e_2: sprite({ look: 2, lift: -1, legs: stepB, armDy: 1 }),
      run_se_1: sprite({ look: 1, legs: stepA }),
      run_se_2: sprite({ look: 1, lift: -1, legs: stepB, armDy: 1 }),
      run_ne_1: sprite({ eyes: 'none', legs: stepA, arms: ['mid', 'up'] }),
      run_ne_2: sprite({ eyes: 'none', lift: -1, legs: stepB, arms: ['mid', 'up'], armDy: 1 }),
      scratch_n_1: sprite({ eyes: 'none', lift: -2, legs: [5, 5, 5, 5], arms: ['up', 'mid'] }),
      scratch_n_2: sprite({ eyes: 'none', lift: -2, legs: [5, 5, 5, 5], arms: ['mid', 'up'] }),
      scratch_s_1: sprite({ arms: ['down', 'mid'] }),
      scratch_s_2: sprite({ arms: ['mid', 'down'] }),
      scratch_e_1: sprite({ look: 2, arms: ['mid', 'out'] }),
      scratch_e_2: sprite({ look: 2, arms: ['mid', 'up'] }),
      wash_1: sprite({ look: -1, arms: ['up', 'mid'] }),
      wash_2: sprite({ look: -1, arms: ['up', 'mid'], armDy: 1 }),
      itch_1: sprite({ look: 1, arms: ['mid', 'up'] }),
      itch_2: sprite({ look: 1, eyes: 'closed', arms: ['mid', 'up'], armDy: 1 }),
      yawn_1: sprite({ height: 13, eyes: 'closed', arms: ['up', 'up'] }),
      yawn_2: sprite({ eyes: 'closed', arms: ['up', 'up'], armDy: 1 }),
      sleep_1: sprite({ height: 9, lift: 3, eyes: 'closed', legs: [0, 0, 0, 0] }),
      sleep_2: sprite({ height: 8, lift: 3, eyes: 'closed', legs: [0, 0, 0, 0] }),
      drag_1: sprite({ lift: -7, eyes: 'wide', arms: ['up', 'up'], legs: [5, 4, 5, 4] }),
      drag_2: sprite({ lift: -7, eyes: 'wide', arms: ['up', 'up'], legs: [4, 5, 4, 5] }),
      purr_1: sprite({ eyes: 'happy', blush: true }),
      purr_2: sprite({ eyes: 'happy', blush: true, armDy: 1 }),
      pounce_1: sprite({ lift: -4, look: 2, arms: ['mid', 'out'], legs: [1, 4, 1, 4] }),
      pounce_2: sprite({ lift: -2, look: 2, arms: ['mid', 'out'], legs: [3, 5, 3, 5] }),
      eat_1: sprite({ look: 2, eyes: 'happy', arms: ['mid', 'down'] }),
      eat_2: sprite({ look: 2, eyes: 'happy', armDy: 1 })
    };
  }

  getStateLabel() {
    const ru = this.isRu();
    if (!this.enabled) return ru ? 'Спит в корзинке' : 'Sleeping in basket';
    const mapRu = {
      sitting: 'Сидит и наблюдает',
      running: `Бежит (${this.direction.toUpperCase()})`,
      scratching: 'Точит когти о край окна',
      washing: 'Умывает мордочку лапкой',
      itching: 'Чешет за ушком',
      yawning: 'Сладко зевает',
      sleeping: 'Свернулся калачиком (Zzz)',
      alert: 'Ушки на макушке (!)',
      dragging: 'Висит за шиворот',
      purring: 'Мурлычет от удовольствия',
      pouncing: 'Охотится за игрушкой',
      eating: 'Уплетает рыбку'
    };
    const mapEn = {
      sitting: 'Sitting & watching',
      running: `Running (${this.direction.toUpperCase()})`,
      scratching: 'Scratching window edge',
      washing: 'Washing face with paw',
      itching: 'Scratching behind ear',
      yawning: 'Yawning sleepily',
      sleeping: 'Curled up asleep (Zzz)',
      alert: 'Startled (!)',
      dragging: 'Picked up by scruff',
      purring: 'Purring happily',
      pouncing: 'Pouncing on toy',
      eating: 'Eating fish treat'
    };
    const clawdRu = {
      scratching: 'Стучит клешнёй по рамке окна',
      washing: 'Размышляет над задачей…',
      itching: 'Обдумывает ответ…',
      yawning: 'Потягивается после сессии',
      sleeping: 'Ждёт следующего запроса (Zzz)',
      dragging: 'Висит за клешню',
      purring: 'Довольно жужжит',
      pouncing: 'Ловит игрушку клешнями'
    };
    const clawdEn = {
      scratching: 'Tapping the window frame',
      washing: 'Thinking it over…',
      itching: 'Working out a reply…',
      yawning: 'Stretching after a session',
      sleeping: 'Waiting for the next prompt (Zzz)',
      dragging: 'Dangling by a claw',
      purring: 'Buzzing happily',
      pouncing: 'Grabbing a toy with claws'
    };
    const clawdLabel = this.isClawd() ? (ru ? clawdRu : clawdEn)[this.state] : null;
    return clawdLabel || (ru ? mapRu : mapEn)[this.state] || (ru ? 'На рабочем столе' : 'On desktop');
  }

  openContextMenu(x, y) {
    if (typeof document === 'undefined') return;
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    const ru = this.isRu();
    const coats = this.getCoats();
    const coatIds = this.getVisibleCoatIds();
    const nextCoatId = coatIds[(coatIds.indexOf(this.settings.coat) + 1) % coatIds.length];
    const nextCoat = coats[nextCoatId];
    const clawd = this.isClawd();

    const items = [
      { label: clawd ? (ru ? 'Похвалить Clawd' : 'Praise Clawd') : (ru ? 'Погладить Neko' : 'Pet Neko'), action: () => this.pet() },
      ...(clawd ? [
        { label: ru ? 'Пусть подумает' : 'Let Clawd Think', action: () => this.think() },
        { label: ru ? 'Снова стать котиком' : 'Turn Back into Neko', action: () => this.toggleClawd() }
      ] : []),
      { label: ru ? 'Пас черновиком со Скрепышом' : 'Play Paper Ball with Clippit', action: () => this.playWithClippy('toss_paper') },
      { label: ru ? 'Бросить красный клубок' : 'Toss Red Yarn Ball', action: () => this.playWithClippy('toss_yarn') },
      { label: ru ? 'Угостить рыбкой' : 'Feed Fish Treat', action: () => this.playWithClippy('feed_fish') },
      { divider: true },
      { label: `${this.settings.mode === 'chase' ? '• ' : ''}${ru ? 'Бегать за курсором' : 'Chase Cursor'}`, action: () => this.setMode('chase') },
      { label: `${this.settings.mode === 'runaway' ? '• ' : ''}${ru ? 'Убегать от курсора' : 'Run Away from Cursor'}`, action: () => this.setMode('runaway') },
      { label: `${this.settings.mode === 'wander' ? '• ' : ''}${ru ? 'Гулять сам по себе' : 'Wander Freely'}`, action: () => this.setMode('wander') },
      { label: `${this.settings.mode === 'clippy' ? '• ' : ''}${ru ? 'Сидеть у Скрепыша' : 'Stay by Clippit'}`, action: () => this.setMode('clippy') },
      { divider: true },
      { label: ru ? `Сменить окрас (${nextCoat.nameRu})` : `Switch Coat (${nextCoat.nameEn})`, action: () => this.setCoat(nextCoatId) },
      { label: ru ? 'Корзинка Neko 98...' : 'Neko 98 Basket...', action: () => this.openBasket() },
      { label: ru ? 'Уложить в корзинку (Выход)' : 'Put in Basket (Exit)', action: () => this.stop() }
    ];

    menu.innerHTML = items.map((it, idx) => {
      if (it.divider) return '<div class="context-menu-divider"></div>';
      return `<div class="context-menu-item" data-neko-cm="${idx}"><span>${it.label}</span></div>`;
    }).join('');

    menu.style.display = 'block';
    const maxX = this.getScreenW() - 210;
    const maxY = this.getScreenH() - 280;
    menu.style.left = `${Math.max(4, Math.min(x, maxX))}px`;
    menu.style.top = `${Math.max(4, Math.min(y, maxY))}px`;

    menu.querySelectorAll('[data-neko-cm]').forEach(node => {
      node.addEventListener('click', (ev) => {
        ev.stopPropagation();
        menu.style.display = 'none';
        const idx = parseInt(node.dataset.nekoCm, 10);
        if (items[idx] && typeof items[idx].action === 'function') {
          items[idx].action();
        }
      });
    });
  }

  openBasket() {
    if (!window.winManager) return null;
    if (window.winManager.hasWindow && window.winManager.hasWindow(this.basketWinId)) {
      window.winManager.bringToTop(this.basketWinId);
      this.refreshBasketWindow();
      return window.winManager.windows.get(this.basketWinId);
    }

    const ru = this.isRu();

    const modes = [
      { id: 'chase', ru: 'За мышкой', en: 'Chase' },
      { id: 'runaway', ru: 'От мышки', en: 'Run Away' },
      { id: 'wander', ru: 'Сам по себе', en: 'Wander' },
      { id: 'clippy', ru: 'У Скрепыша', en: 'By Clippit' }
    ];
    const modeButtons = modes.map(m => `
      <button type="button" class="neko-mode-pill${this.settings.mode === m.id ? ' is-active' : ''}" data-neko-mode="${m.id}">
        ${ru ? m.ru : m.en}
      </button>
    `).join('');

    const html = `
      <div class="neko-basket-root">
        <div class="neko-basket-hearth">
          <div class="neko-basket-stage" id="neko_basket_stage" title="${ru ? 'Нажмите, чтобы погладить Neko' : 'Click to pet Neko'}">
            <canvas id="neko_basket_canvas" width="112" height="78"></canvas>
          </div>
          <div class="neko-collar-plaque">
            <div class="neko-plaque-header">
              <span id="neko_plaque_title">Neko 98 (${ru ? this.getCurrentCoat().nameRu : this.getCurrentCoat().nameEn})</span>
              <span class="neko-plaque-bell" title="${ru ? 'Бубенчик на ошейнике' : 'Collar Bell'}"></span>
            </div>
            <div class="neko-plaque-state" id="neko_plaque_state">${this.getStateLabel()}</div>
            <div class="neko-plaque-counters" id="neko_plaque_stats">
              <span>♥ ${this.stats.petted}</span>
              <span>📄 ${this.stats.paperBallsBatted}</span>
              <span>🐟 ${this.stats.fishEaten}</span>
            </div>
            <div class="neko-plaque-btns">
              <button type="button" class="win-btn" id="neko_btn_toggle">${this.enabled ? (ru ? 'В корзинку' : 'Recall') : (ru ? 'Выпустить!' : 'Release!')}</button>
              <button type="button" class="win-btn" id="neko_btn_pet">${ru ? 'Мяу! ♥' : 'Meow! ♥'}</button>
            </div>
          </div>
        </div>

        <div class="neko-section-label">${ru ? 'Окрас и порода:' : 'Coat & Breed:'}</div>
        <div class="neko-coat-ribbon">
          ${this.getCoatRibbonHtml()}
        </div>

        <div class="neko-section-label">${ru ? 'Повадки на рабочем столе:' : 'Desktop Habit:'}</div>
        <div class="neko-mode-bar">
          ${modeButtons}
        </div>

        <div class="neko-speed-row">
          <span>${ru ? 'Резвость лапок:' : 'Running Speed:'}</span>
          <input type="range" id="neko_speed_range" min="2" max="6.5" step="0.5" value="${this.speed}">
          <span id="neko_speed_val">${this.speed.toFixed(1)}</span>
        </div>

        <div class="neko-toys-row">
          <button type="button" class="win-btn" data-neko-toy="yarn">${ru ? '🧶 Клубок' : '🧶 Yarn'}</button>
          <button type="button" class="win-btn" data-neko-toy="paper_ball">${ru ? '📄 Пас со Скрепышом' : '📄 Paper Pass'}</button>
          <button type="button" class="win-btn" data-neko-toy="fish">${ru ? '🐟 Рыбка' : '🐟 Fish'}</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.basketWinId,
      title: ru ? 'Корзинка Neko 98 (NEKO.EXE)' : 'Neko 98 Basket (NEKO.EXE)',
      icon: 'neko',
      width: 348,
      height: 312,
      resizable: false,
      maximizable: false,
      content: html,
      onClose: () => {
        if (this.basketAnimId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.basketAnimId);
        }
        this.basketAnimId = null;
      }
    });

    this.bindBasketEvents(win.element);
    this.startBasketPreviewLoop();
    return win;
  }

  getCoatRibbonHtml() {
    const ru = this.isRu();
    const coats = this.getCoats();
    return this.getVisibleCoatIds().map(id => coats[id]).map(c => `
      <button type="button" class="neko-coat-swatch${this.settings.coat === c.id ? ' is-active' : ''}" data-neko-coat="${c.id}" title="${ru ? c.fullRu : c.fullEn}">
        <span class="neko-coat-dot" style="background:${c.swatch}"></span>
        <span>${ru ? c.nameRu : c.nameEn}</span>
      </button>
    `).join('');
  }

  bindCoatButtons(root) {
    root.querySelectorAll('[data-neko-coat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setCoat(btn.dataset.nekoCoat);
      });
    });
  }

  renderCoatRibbon() {
    if (!window.winManager || !window.winManager.windows) return;
    const win = window.winManager.windows.get(this.basketWinId);
    if (!win || !win.element) return;
    const ribbon = win.element.querySelector('.neko-coat-ribbon');
    if (!ribbon || ribbon.querySelectorAll('[data-neko-coat]').length === this.getVisibleCoatIds().length) return;
    ribbon.innerHTML = this.getCoatRibbonHtml();
    this.bindCoatButtons(ribbon);
  }

  bindBasketEvents(el) {
    if (!el || !el.querySelectorAll) return;

    const stage = el.querySelector('#neko_basket_stage');
    if (stage) {
      stage.addEventListener('click', () => {
        this.pet();
      });
    }

    const toggleBtn = el.querySelector('#neko_btn_toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.enabled) this.stop();
        else {
          this.start();
          this.playSound('meow');
        }
        this.refreshBasketWindow();
      });
    }

    const petBtn = el.querySelector('#neko_btn_pet');
    if (petBtn) {
      petBtn.addEventListener('click', () => {
        this.pet();
      });
    }

    this.bindCoatButtons(el);

    el.querySelectorAll('[data-neko-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.enabled) this.start();
        this.setMode(btn.dataset.nekoMode);
      });
    });

    el.querySelectorAll('[data-neko-toy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toy = btn.dataset.nekoToy;
        if (toy === 'paper_ball') this.playWithClippy('toss_paper');
        else if (toy === 'fish') this.playWithClippy('feed_fish');
        else this.playWithClippy('toss_yarn');
      });
    });

    const speedInput = el.querySelector('#neko_speed_range');
    if (speedInput) {
      speedInput.addEventListener('input', () => {
        this.setSpeed(speedInput.value);
      });
    }
  }

  refreshBasketWindow() {
    if (!window.winManager || !window.winManager.windows) return;
    const win = window.winManager.windows.get(this.basketWinId);
    if (!win || !win.element) return;
    const el = win.element;
    const ru = this.isRu();
    const coat = this.getCurrentCoat();

    const titleEl = el.querySelector('#neko_plaque_title');
    if (titleEl) titleEl.textContent = `Neko 98 (${ru ? coat.nameRu : coat.nameEn})`;

    const stateEl = el.querySelector('#neko_plaque_state');
    if (stateEl) stateEl.textContent = this.getStateLabel();

    const statsEl = el.querySelector('#neko_plaque_stats');
    if (statsEl) {
      statsEl.innerHTML = `<span>♥ ${this.stats.petted}</span><span>📄 ${this.stats.paperBallsBatted}</span><span>🐟 ${this.stats.fishEaten}</span>`;
    }

    const toggleBtn = el.querySelector('#neko_btn_toggle');
    if (toggleBtn) {
      toggleBtn.textContent = this.enabled ? (ru ? 'В корзинку' : 'Recall') : (ru ? 'Выпустить!' : 'Release!');
    }

    const petBtn = el.querySelector('#neko_btn_pet');
    if (petBtn) {
      petBtn.textContent = this.isClawd() ? (ru ? 'Молодец! ♥' : 'Good job! ♥') : (ru ? 'Мяу! ♥' : 'Meow! ♥');
    }

    const speedValEl = el.querySelector('#neko_speed_val');
    if (speedValEl) speedValEl.textContent = this.speed.toFixed(1);

    el.querySelectorAll('[data-neko-coat]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.nekoCoat === this.settings.coat);
    });

    el.querySelectorAll('[data-neko-mode]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.nekoMode === this.settings.mode);
    });

    this.drawBasketPreview();
  }

  startBasketPreviewLoop() {
    const step = () => {
      if (!window.winManager || !window.winManager.hasWindow || !window.winManager.hasWindow(this.basketWinId)) {
        this.basketAnimId = null;
        return;
      }
      if (!this.enabled) this.frame++;
      this.drawBasketPreview();
      if (typeof requestAnimationFrame === 'function') {
        this.basketAnimId = requestAnimationFrame(step);
      }
    };
    step();
  }

  drawBasketPreview() {
    if (!window.winManager || !window.winManager.windows) return;
    const win = window.winManager.windows.get(this.basketWinId);
    if (!win || !win.element) return;
    const canvas = win.element.querySelector('#neko_basket_canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 112, 78);
    ctx.fillStyle = '#1e3a4c';
    ctx.fillRect(0, 0, 112, 54);
    ctx.fillStyle = '#3b2818';
    ctx.fillRect(0, 54, 112, 24);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(18, 42, 76, 26);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(14, 38, 84, 8);
    ctx.fillStyle = '#d97706';
    for (let bx = 18; bx < 92; bx += 8) {
      ctx.fillRect(bx, 40, 4, 4);
      ctx.fillRect(bx + 2, 48, 4, 6);
      ctx.fillRect(bx, 58, 4, 6);
    }

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(22, 42, 68, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(26, 43, 60, 5);

    let pose;
    if (Date.now() < this.basketPerkUntil) pose = { frameKey: 'alert_2', flipX: false };
    else if (this.enabled) pose = this.getSpriteFrame();
    else pose = { frameKey: Math.floor(this.frame / 28) % 2 === 0 ? 'sleep_1' : 'sleep_2', flipX: false };
    const { frameKey, flipX } = pose;

    this.drawCatFrame(ctx, frameKey, 56, 36, 32, flipX, this.getCurrentCoat());
  }

  playSound(type) {
    if (!this.settings.sound) return;
    if (window.soundSys && window.soundSys.muted) return;
    const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AudioCtx) return;
    try {
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      const now = ctx.currentTime;

      if (type === 'clawd') {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const note = ctx.createOscillator();
          const amp = ctx.createGain();
          const t0 = now + i * 0.08;
          note.type = 'square';
          note.frequency.setValueAtTime(freq, t0);
          amp.gain.setValueAtTime(0.0001, t0);
          amp.gain.linearRampToValueAtTime(0.035, t0 + 0.01);
          amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
          note.connect(amp);
          amp.connect(ctx.destination);
          note.start(t0);
          note.stop(t0 + 0.13);
        });
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'meow') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(840, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.26);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'purr') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.linearRampToValueAtTime(115, now + 0.18);
        osc.frequency.linearRampToValueAtTime(90, now + 0.36);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.39);
      } else if (type === 'alert') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(990, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'pounce' || type === 'munch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'munch' ? 340 : 280, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'munch' ? 460 : 520, now + 0.09);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch (e) {}
  }

  processList() {
    if (!this.enabled) return [];
    const cpu = this.state === 'running' || this.state === 'pouncing' ? 0.6 : (this.state === 'sleeping' ? 0.0 : 0.2);
    return [{
      pid: 1998,
      imageName: 'neko.exe',
      cpu,
      mem: 960,
      priority: 'Normal',
      user: 'User',
      isNeko: true
    }];
  }
}

window.appNeko = new AppNeko();
