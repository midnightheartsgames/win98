class AppESheep {
  constructor() {
    this.storageKey = 'win98_esheep_settings';
    this.propsWinId = 'app_esheep_props';
    this.aboutWinId = 'app_esheep_about';
    this.tileSize = 40;
    this.cols = 16;
    this.rows = 11;

    this.enabled = false;
    this.layerEl = null;
    this.canvas = null;
    this.ctx = null;
    this.trayEl = null;
    this.animId = null;
    this.lastTick = 0;

    this.sheepList = [];
    this.propsList = [];
    this.particles = [];
    this.nextSheepId = 1;
    this.nextPropId = 1;
    this.draggingSheep = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVelX = 0;
    this.prevWinRects = new Map();

    this.stats = {
      spawned: 0,
      daisiesEaten: 0,
      bathsTaken: 0,
      ufoVisits: 0,
      blackSheepMet: 0
    };

    this.settings = this.loadSettings();
    this.spriteImg = null;
    this.spriteLoaded = false;
    this.previewAnimId = null;
    this.previewAction = 'walk';
    this.previewTick = 0;

    this.loadSpriteSheet();
    this.bindGlobalEvents();
    this.scheduleAutoStart();
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  isRu() {
    return !window.i18n || window.i18n.currentLang !== 'en';
  }

  loadSettings() {
    const defaults = {
      walkOnWindows: true,
      climbWalls: true,
      specialEvents: true,
      sound: true,
      autoStart: false,
      scale: 1,
      speed: 1,
      maxSheep: 16
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
    this.syncActorElements();
    this.refreshControlPanel();
  }

  loadSpriteSheet() {
    if (typeof Image === 'undefined') return;
    const img = new Image();
    img.onload = () => {
      this.spriteImg = img;
      this.spriteLoaded = true;
    };
    img.src = 'content/esheep/sprites.png';
  }

  scheduleAutoStart() {
    if (typeof window === 'undefined' || typeof setTimeout === 'undefined') return;
    setTimeout(() => {
      if (this.settings.autoStart && window.gameManager && window.gameManager.isInstalled('esheep') && !this.enabled) {
        this.start(1);
      }
    }, 1200);
  }

  bindGlobalEvents() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    window.addEventListener('resize', () => this.resizeCanvas());

    document.addEventListener('mousemove', (e) => {
      this.mouseVelX = e.clientX - this.lastMouseX;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      if (this.draggingSheep) {
        const size = this.getSpriteSize();
        this.draggingSheep.x = Math.max(-size * 0.3, Math.min(this.getScreenW() - size * 0.7, e.clientX - this.dragOffsetX));
        this.draggingSheep.y = Math.max(-size * 0.3, Math.min(this.getTaskbarTop() - size, e.clientY - this.dragOffsetY));
        this.draggingSheep.dragMoved = true;
        if (this.mouseVelX < -2) this.draggingSheep.frame = 43;
        else if (this.mouseVelX > 2) this.draggingSheep.frame = 44;
        else this.draggingSheep.frame = 42;
        this.syncSingleActor(this.draggingSheep);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.draggingSheep) {
        const s = this.draggingSheep;
        this.draggingSheep = null;
        if (s.el) s.el.classList.remove('is-dragging');
        if (s.dragMoved) {
          const droppedOnClippy = this.checkDroppedOnClippy(s);
          if (!droppedOnClippy) {
            s.surfaceId = null;
            this.setAnim(s, 'fall');
          }
        } else {
          this.setAnim(s, 'walk');
        }
      }
    });
  }

  checkDroppedOnClippy(sheep) {
    const clippy = typeof window !== 'undefined' && window.appClippy;
    const sys = typeof window !== 'undefined' && window.clippySystem;
    if (!clippy || !clippy.visible || !clippy.charEl || !clippy.charEl.getBoundingClientRect) return false;
    if (!sys || typeof sys.onESheepDroppedOnClippy !== 'function') return false;
    const r = clippy.charEl.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return false;
    const size = this.getSpriteSize();
    const sx = sheep.x + size * 0.5;
    const sy = sheep.y + size * 0.5;
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    if (Math.hypot(sx - cx, sy - cy) > Math.max(78, size * 1.4)) return false;
    const groundY = this.getTaskbarTop() - size;
    sheep.y = groundY;
    sheep.surfaceId = 'taskbar';
    sheep.x = Math.max(0, Math.min(this.getScreenW() - size, Math.round(r.left - size * 0.65)));
    sheep.dir = 1;
    this.setAnim(sheep, 'bleat');
    this.syncSingleActor(sheep);
    sys.onESheepDroppedOnClippy(sheep);
    return true;
  }

  getScreenW() {
    return (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800;
  }

  getScreenH() {
    return (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 600;
  }

  getSpriteSize() {
    return Math.round(this.tileSize * (Number(this.settings.scale) || 1));
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

  isRunning() {
    return Boolean(this.enabled && this.sheepList.length > 0);
  }

  open() {
    if (!this.enabled) {
      this.start(1);
      this.playSound('baa');
      return this.sheepList[0] || null;
    }
    if (this.sheepList.length < (this.settings.maxSheep || 16)) {
      const s = this.spawnSheep();
      this.playSound('baa');
      return s;
    }
    this.openSettings();
    return this.sheepList[0] || null;
  }

  toggle() {
    if (this.enabled) {
      this.stop();
    } else {
      this.start(1);
    }
  }

  start(initialCount = 1) {
    if (!this.enabled) {
      this.enabled = true;
      this.ensureLayer();
      this.ensureTrayIcon();
      this.lastTick = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.scheduleNextFrame();
    }
    const count = Math.max(1, Number(initialCount) || 1);
    for (let i = 0; i < count; i++) {
      if (this.sheepList.length < (this.settings.maxSheep || 16)) {
        this.spawnSheep();
      }
    }
    this.updateTrayTooltip();
    this.refreshControlPanel();
  }

  stop() {
    this.enabled = false;
    this.draggingSheep = null;
    if (this.animId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animId);
    }
    this.animId = null;
    this.sheepList.forEach(s => {
      if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
    });
    this.sheepList = [];
    this.propsList = [];
    this.particles = [];
    if (this.layerEl && this.layerEl.parentNode) {
      this.layerEl.parentNode.removeChild(this.layerEl);
    }
    this.layerEl = null;
    this.canvas = null;
    this.ctx = null;
    this.removeTrayIcon();
    this.refreshControlPanel();
  }

  ensureLayer() {
    if (typeof document === 'undefined' || !document.body) return;
    if (!this.layerEl) {
      this.layerEl = document.createElement('div');
      this.layerEl.id = 'esheep-layer';
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'esheep-canvas';
      this.layerEl.appendChild(this.canvas);
      document.body.appendChild(this.layerEl);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.getScreenW();
    this.canvas.height = this.getScreenH();
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
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
    el.id = 'tray-esheep-icon';
    el.className = 'tray-icon';
    el.innerHTML = (typeof Icons !== 'undefined' && Icons['esheep']) ? Icons['esheep'] : '';
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';

    let trayClickTimer = null;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (trayClickTimer) {
        clearTimeout(trayClickTimer);
        trayClickTimer = null;
      }
      trayClickTimer = setTimeout(() => {
        trayClickTimer = null;
        if (this.sheepList.length < (this.settings.maxSheep || 16)) {
          this.spawnSheep();
          this.playSound('baa');
        } else {
          this.openSettings();
        }
      }, 200);
    });

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (trayClickTimer) {
        clearTimeout(trayClickTimer);
        trayClickTimer = null;
      }
      this.openSettings();
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (trayClickTimer) {
        clearTimeout(trayClickTimer);
        trayClickTimer = null;
      }
      this.openSettings();
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
    const count = this.sheepList.length;
    this.trayEl.title = this.isRu()
      ? `eSheep 98 (Sheep.exe) — овечек: ${count} (ЛКМ: +овечка, ПКМ: свойства)`
      : `eSheep 98 (Sheep.exe) — sheep: ${count} (Click: +sheep, Right-click: properties)`;
  }

  spawnSheep(options = {}) {
    if (!this.enabled) {
      this.enabled = true;
      this.ensureLayer();
      this.ensureTrayIcon();
      this.lastTick = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.scheduleNextFrame();
    }
    const size = this.getSpriteSize();
    const screenW = this.getScreenW();
    const groundY = this.getTaskbarTop() - size;
    const mode = options.mode || 'sky';

    let x = typeof options.x === 'number'
      ? options.x
      : Math.round(40 + Math.random() * Math.max(80, screenW - size - 80));
    let y = typeof options.y === 'number'
      ? options.y
      : -size - 10;
    let dir = options.dir || (Math.random() < 0.5 ? -1 : 1);
    let initialAnim = 'fall';

    if (mode === 'walk_in') {
      dir = Math.random() < 0.5 ? -1 : 1;
      x = dir === -1 ? screenW + 4 : -size - 4;
      y = groundY;
      initialAnim = 'walk';
    }

    const sheep = {
      id: this.nextSheepId++,
      x,
      y,
      vx: 0,
      vy: 0,
      dir,
      anim: initialAnim,
      stepIdx: 0,
      stepTimer: 0,
      loopCount: 0,
      targetLoops: 0,
      airTicks: 0,
      frame: 133,
      offsetY: 0,
      opacity: 1,
      surfaceId: mode === 'walk_in' ? 'taskbar' : null,
      dragMoved: false,
      propId: null,
      el: null
    };

    this.createActorElement(sheep);
    this.sheepList.push(sheep);
    this.stats.spawned++;

    if (options.anim) {
      this.setAnim(sheep, options.anim);
    } else {
      this.setAnim(sheep, initialAnim);
    }

    this.syncSingleActor(sheep);
    this.updateTrayTooltip();
    this.refreshControlPanel();
    if (this.sheepList.length >= 5 && typeof window !== 'undefined' && window.clippySystem && typeof window.clippySystem.onESheepEvent === 'function') {
      window.clippySystem.onESheepEvent('crowd', sheep);
    }
    return sheep;
  }

  removeSheep(sheepOrId) {
    const id = typeof sheepOrId === 'object' && sheepOrId ? sheepOrId.id : sheepOrId;
    const idx = this.sheepList.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const [removed] = this.sheepList.splice(idx, 1);
    if (removed.el && removed.el.parentNode) {
      removed.el.parentNode.removeChild(removed.el);
    }
    this.propsList = this.propsList.filter(p => p.ownerId !== removed.id);
    if (this.sheepList.length === 0) {
      this.stop();
    } else {
      this.updateTrayTooltip();
      this.refreshControlPanel();
    }
    return true;
  }

  setFlockSize(targetCount) {
    const target = Math.max(0, Math.min(this.settings.maxSheep || 16, Math.round(Number(targetCount) || 0)));
    if (target === 0) {
      this.stop();
      return;
    }
    if (!this.enabled) {
      this.start(target);
      return;
    }
    while (this.sheepList.length < target) {
      this.spawnSheep();
    }
    while (this.sheepList.length > target) {
      this.removeSheep(this.sheepList[this.sheepList.length - 1]);
    }
  }

  createActorElement(sheep) {
    if (!this.layerEl || typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.className = 'esheep-actor';
    el.dataset.sheepId = String(sheep.id);

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      this.draggingSheep = sheep;
      sheep.dragMoved = false;
      sheep.surfaceId = null;
      this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
      this.dragOffsetX = e.clientX - sheep.x;
      this.dragOffsetY = e.clientY - sheep.y;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.setAnim(sheep, 'drag');
      el.classList.add('is-dragging');
      this.playSound('pop');
    });

    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.draggingSheep === sheep) {
        this.draggingSheep = null;
        el.classList.remove('is-dragging');
      }
      this.pokeSheep(sheep);
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openContextMenu(e.clientX, e.clientY, sheep);
    });

    this.layerEl.appendChild(el);
    sheep.el = el;
  }

  syncActorElements() {
    this.sheepList.forEach(s => this.syncSingleActor(s));
  }

  syncSingleActor(sheep) {
    if (!sheep || !sheep.el) return;
    const size = this.getSpriteSize();
    sheep.el.style.width = `${size}px`;
    sheep.el.style.height = `${size}px`;
    sheep.el.style.left = `${Math.round(sheep.x)}px`;
    sheep.el.style.top = `${Math.round(sheep.y + (sheep.offsetY || 0))}px`;
    sheep.el.dataset.anim = sheep.anim;
    sheep.el.dataset.frame = String(sheep.frame);
  }

  pokeSheep(sheep) {
    if (!sheep) return;
    this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
    const useSync = Math.random() < 0.45;
    this.setAnim(sheep, useSync ? 'sync' : 'kill');
    this.playSound('baa');
  }

  getWindowPlatforms() {
    const platforms = [];
    if (!this.settings.walkOnWindows || typeof document === 'undefined') return platforms;
    const taskbarTop = this.getTaskbarTop();
    const size = this.getSpriteSize();

    let winEls = [];
    if (document.querySelectorAll) {
      winEls = Array.from(document.querySelectorAll('#windows-container .win-window, .win-window'));
    } else if (window.winManager && window.winManager.windows) {
      window.winManager.windows.forEach(w => {
        if (w && w.element) winEls.push(w.element);
      });
    }

    for (const el of winEls) {
      if (!el || !el.getBoundingClientRect) continue;
      if (el.classList && (el.classList.contains('minimized') || el.classList.contains('maximized'))) continue;
      if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) continue;
      const r = el.getBoundingClientRect();
      if (!r || r.width < 60 || r.height < 30) continue;
      const top = Math.round(r.top);
      if (top < size * 0.5 || top > taskbarTop - 16) continue;
      platforms.push({
        id: el.id || `win_${platforms.length}`,
        top,
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        zIndex: parseInt((el.style && el.style.zIndex) || '1', 10) || 1
      });
    }

    platforms.sort((a, b) => b.zIndex - a.zIndex);
    return platforms;
  }

  isWindowTopExposed(plat, centerX, allPlatforms) {
    if (centerX < plat.left - 8 || centerX > plat.right + 8) return false;
    for (const other of allPlatforms) {
      if (other.id === plat.id) continue;
      if (other.zIndex > plat.zIndex) {
        if (centerX >= other.left && centerX <= other.right && plat.top >= other.top && plat.top <= other.bottom) {
          return false;
        }
      }
    }
    return true;
  }

  findLandingSurface(sheep, prevY, nextY, platforms) {
    const size = this.getSpriteSize();
    const taskbarTop = this.getTaskbarTop();
    const groundY = taskbarTop - size;
    const centerX = sheep.x + size * 0.5;

    for (const plat of platforms) {
      const platSheepY = plat.top - size;
      if (prevY <= platSheepY + 8 && nextY >= platSheepY) {
        if (this.isWindowTopExposed(plat, centerX, platforms)) {
          return { id: plat.id, y: platSheepY, left: plat.left - size * 0.35, right: plat.right - size * 0.65 };
        }
      }
    }

    if (nextY >= groundY) {
      return { id: 'taskbar', y: groundY, left: 0, right: this.getScreenW() - size };
    }
    return null;
  }

  getSurfaceBounds(sheep, platforms) {
    const size = this.getSpriteSize();
    const taskbarTop = this.getTaskbarTop();
    const groundY = taskbarTop - size;
    const centerX = sheep.x + size * 0.5;

    if (!sheep.surfaceId || sheep.surfaceId === 'taskbar') {
      if (Math.abs(sheep.y - groundY) <= 8) {
        return { id: 'taskbar', y: groundY, left: 0, right: this.getScreenW() - size, isWindow: false };
      }
    }

    if (sheep.surfaceId && sheep.surfaceId !== 'taskbar') {
      const plat = platforms.find(p => p.id === sheep.surfaceId);
      if (plat && this.isWindowTopExposed(plat, centerX, platforms)) {
        return {
          id: plat.id,
          y: plat.top - size,
          left: plat.left - size * 0.35,
          right: plat.right - size * 0.65,
          isWindow: true
        };
      }
      return null;
    }

    for (const plat of platforms) {
      if (Math.abs(sheep.y - (plat.top - size)) <= 6 && this.isWindowTopExposed(plat, centerX, platforms)) {
        return {
          id: plat.id,
          y: plat.top - size,
          left: plat.left - size * 0.35,
          right: plat.right - size * 0.65,
          isWindow: true
        };
      }
    }

    if (Math.abs(sheep.y - groundY) <= 8) {
      return { id: 'taskbar', y: groundY, left: 0, right: this.getScreenW() - size, isWindow: false };
    }
    return null;
  }

  applyWindowDragDeltas(platforms) {
    const nextMap = new Map();
    for (const p of platforms) {
      nextMap.set(p.id, { left: p.left, top: p.top });
      const prev = this.prevWinRects.get(p.id);
      if (prev && (prev.left !== p.left || prev.top !== p.top)) {
        const dx = p.left - prev.left;
        const dy = p.top - prev.top;
        for (const s of this.sheepList) {
          if (s.surfaceId === p.id && s !== this.draggingSheep) {
            s.x += dx;
            s.y += dy;
          }
        }
      }
    }
    this.prevWinRects = nextMap;
  }

  getAnimDef(name) {
    const defs = {
      fall: {
        frames: [133],
        interval: 60,
        dx: 0,
        dy: 4.5,
        repeat: 22
      },
      fall_fast: {
        frames: [46],
        interval: 45,
        dx: 0,
        dy: 9.5,
        repeat: 200
      },
      fall_soft: {
        frames: [133, 133, 49, 13, 12, 6],
        interval: 130,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      fall_hard: {
        frames: [48, 48, 48, 48, 47],
        interval: 190,
        dx: 0,
        dy: 0,
        offsetY: 2,
        next: 'walk'
      },
      walk: {
        frames: [2, 3],
        interval: 170,
        dx: 2.5,
        dy: 0,
        repeat: 18
      },
      rotate: {
        frames: [3, 9, 10, 10, 9, 3],
        flipAt: 3,
        interval: 140,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      run_begin: {
        frames: [2, 3, 2, 5, 4, 5, 4, 5],
        interval: 110,
        dx: 5,
        dy: 0,
        next: 'run'
      },
      run: {
        frames: [5, 4, 4],
        interval: 85,
        dx: 8.5,
        dy: 0,
        repeat: 7
      },
      run_end: {
        frames: [5, 4, 5, 4, 5, 3, 2, 3],
        interval: 120,
        dx: 4,
        dy: 0,
        next: 'walk'
      },
      jump: {
        frames: [76, 30, 30, 30, 23, 23, 24, 24, 77],
        dySteps: [0, -9, -7, -3, 3, 7, 9, 0, 0],
        interval: 85,
        dx: 7,
        dy: 0,
        next: 'run'
      },
      boing: {
        frames: [62, 62, 63, 64, 65, 66, 67, 68, 69, 70, 6],
        interval: 90,
        dx: -4.5,
        dy: 0,
        next: 'rotate'
      },
      drag: {
        frames: [42, 43, 44],
        interval: 100,
        dx: 0,
        dy: 0,
        repeat: 999
      },
      kill: {
        frames: [3, 96, 96, 96, 96, 96, 84, 85, 86, 31, 3],
        interval: 140,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      sync: {
        frames: [50, 51, 50, 51, 50, 51, 50, 51, 50, 51, 6],
        interval: 65,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      sleep1: {
        frames: [
          3, 107, 108, 107, 108, 107, 31, 32, 33,
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 80, 79, 78, 77, 37, 38, 39, 38, 37, 6
        ],
        interval: 220,
        dx: 0,
        dy: 0,
        zzzRange: [9, 26],
        next: 'walk'
      },
      sleep2: {
        frames: [3, 6, 7, 8, 8, 7, 8, 8, 8, 8, 7, 8, 8, 8, 7, 6],
        interval: 210,
        dx: 0,
        dy: 0,
        zzzRange: [3, 13],
        next: 'run_begin'
      },
      sleep3: {
        frames: [
          3, 9, 10, 34, 35, 34, 35,
          36, 36, 36, 36, 36, 36, 36, 36, 36,
          35, 34, 10, 9, 3
        ],
        interval: 210,
        dx: 0,
        dy: 0,
        offsetY: 1,
        zzzRange: [7, 15],
        next: 'walk'
      },
      sleep4: {
        frames: [9, 10, 81, 82, 83, 83, 83, 83, 83, 83, 82, 81, 10, 9, 3],
        interval: 210,
        dx: 0,
        dy: 0,
        zzzRange: [4, 9],
        next: 'walk'
      },
      pee: {
        frames: [
          3, 12, 13, 103, 104,
          105, 106, 105, 106, 105, 106, 105, 106, 105, 106,
          104, 105, 104, 103, 13, 12, 3
        ],
        interval: 170,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      eat_daisy: {
        frames: [
          6, 6, 58, 59, 59, 60, 61, 60, 61,
          58, 59, 59, 60, 61, 60, 61,
          58, 59, 59, 60, 61, 60, 61,
          58, 59, 59, 60, 61, 60, 61, 6
        ],
        interval: 180,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      cartwheel: {
        frames: [9, 10, 112, 113, 114, 115, 115, 116, 117, 118, 119, 10, 9, 3],
        interval: 110,
        dx: 1.5,
        dy: 0,
        next: 'walk'
      },
      handstand_spin: {
        frames: [9, 10, 120, 121, 122, 123, 124, 125, 126, 10, 9, 3],
        interval: 115,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      barrel_roll: {
        frames: [31, 32, 91, 92, 93, 94, 95, 91, 92, 93, 94, 95, 33, 31, 3],
        interval: 105,
        dx: 3.5,
        dy: 0,
        next: 'walk'
      },
      sneeze: {
        frames: [3, 52, 52, 53, 53, 52, 6, 3],
        interval: 150,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      bleat: {
        frames: [9, 10, 54, 55, 54, 55, 54, 10, 9, 3],
        interval: 160,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      graze: {
        frames: [3, 56, 57, 56, 57, 56, 57, 56, 57, 3],
        interval: 180,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      stretch: {
        frames: [3, 71, 71, 72, 72, 71, 72, 3],
        interval: 180,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      cry: {
        frames: [3, 109, 110, 111, 110, 111, 110, 111, 109, 6],
        interval: 170,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      waddle: {
        frames: [9, 10, 87, 88, 89, 90, 88, 89, 90, 88, 89, 10, 9, 3],
        interval: 140,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      wag_tail: {
        frames: [12, 13, 131, 132, 131, 132, 131, 132, 13, 12, 3],
        interval: 145,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      look_down: {
        frames: [6, 78, 78, 79, 80, 79, 78, 78],
        interval: 135,
        dx: 0,
        dy: 0
      },
      jump_down: {
        frames: [31, 30, 30, 4, 4, 21, 25],
        dySteps: [0, -7, -5, -1, 4, 8, 10],
        interval: 95,
        dx: 5,
        dy: 0,
        next: 'jump_down_fall'
      },
      jump_down_fall: {
        frames: [25],
        interval: 50,
        dx: 1.5,
        dy: 10,
        repeat: 120
      },
      jump_down_land: {
        frames: [24, 23, 23, 23, 31, 3, 3],
        interval: 130,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      slip_win: {
        frames: [
          77, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41, 40, 41
        ],
        flipAt: 1,
        interval: 105,
        dx: 0,
        dy: 0.5,
        next: 'slip_win_fall'
      },
      slip_win_fall: {
        frames: [29],
        interval: 45,
        dx: 0,
        dy: 11,
        repeat: 150
      },
      slip_win_land: {
        frames: [45, 45, 45, 18, 76, 6],
        interval: 210,
        dx: 0,
        dy: 0,
        next: 'walk'
      },
      climb_up: {
        frames: [15, 16],
        interval: 140,
        dx: 0,
        dy: -3,
        repeat: 400
      },
      corner_to_ceiling: {
        frames: [16, 17, 28],
        flipAt: 2,
        interval: 160,
        dx: 0,
        dy: 0,
        next: 'ceiling_walk'
      },
      ceiling_walk: {
        frames: [98, 97, 98, 97, 98, 97, 99, 100, 99, 98, 97],
        interval: 145,
        dx: 2.5,
        dy: 0,
        offsetY: -2,
        repeat: 10
      },
      ceiling_to_wall: {
        frames: [97, 97],
        flipAt: 1,
        interval: 180,
        dx: 0,
        dy: 0,
        next: 'climb_down'
      },
      climb_down: {
        frames: [19, 20],
        interval: 140,
        dx: 0,
        dy: 3,
        repeat: 400
      },
      climb_over: {
        frames: [24, 6, 6, 6],
        interval: 160,
        dx: 0,
        dy: 0,
        next: 'walk'
      }
    };
    return defs[name] || defs.walk;
  }

  setAnim(sheep, animName) {
    if (!sheep) return;
    if (animName === 'meteor_bath' || animName === 'black_sheep' || animName === 'ufo_alien') {
      this.startSpecialScene(sheep, animName);
      return;
    }

    const def = this.getAnimDef(animName);
    sheep.anim = animName;
    sheep.stepIdx = 0;
    sheep.stepTimer = 0;
    sheep.loopCount = 0;
    sheep.targetLoops = def.repeat || 0;
    sheep.offsetY = def.offsetY || 0;
    sheep.opacity = 1;
    sheep.frame = def.frames[0];
    if (animName === 'fall') {
      sheep.airTicks = 0;
    }

    if (animName === 'eat_daisy') {
      this.spawnDaisyProp(sheep);
      this.stats.daisiesEaten++;
      this.playSound('chomp');
    } else if (animName === 'sneeze') {
      this.playSound('sneeze');
    } else if (animName === 'bleat') {
      this.playSound('baa');
    } else if (animName === 'boing') {
      this.playSound('boing');
    } else if (animName === 'fall_hard' || animName === 'slip_win_land') {
      this.playSound('thud');
    } else if (animName === 'pee') {
      if (typeof window !== 'undefined' && window.clippySystem && typeof window.clippySystem.onESheepEvent === 'function') {
        window.clippySystem.onESheepEvent('pee', sheep);
      }
    }
  }

  spawnDaisyProp(sheep) {
    this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
    const size = this.getSpriteSize();
    const flowerFrames = [
      153, 153, 153, 153, 153, 153,
      149, 149, 149, 149, 149, 149, 149,
      150, 150, 150, 150, 150, 150,
      151, 151, 151, 151, 151, 151,
      152, 152, 152, 152, 152, 174
    ];
    this.propsList.push({
      id: this.nextPropId++,
      ownerId: sheep.id,
      type: 'flower',
      x: Math.round(sheep.x + sheep.dir * size * 0.85),
      y: Math.round(sheep.y),
      frames: flowerFrames,
      stepIdx: 0,
      stepTimer: 0,
      interval: 180,
      frame: 153,
      flipped: false,
      opacity: 1
    });
  }

  startSpecialScene(sheep, sceneType) {
    if (!sheep) return;
    this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
    const size = this.getSpriteSize();
    const screenW = this.getScreenW();
    const groundY = this.getTaskbarTop() - size;
    if (typeof window !== 'undefined' && window.clippySystem && typeof window.clippySystem.onESheepEvent === 'function') {
      window.clippySystem.onESheepEvent(sceneType, sheep);
    }

    if (sceneType === 'meteor_bath') {
      this.stats.bathsTaken++;
      this.playSound('meteor');
      const bathX = Math.round(Math.max(size * 2, Math.min(screenW - size * 4, sheep.x)));
      const flightSteps = 44;
      const dxPerStep = -2.8;
      const dyPerStep = 2.8;
      const startX = Math.round(bathX - dxPerStep * flightSteps);
      const startY = Math.round(groundY - dyPerStep * flightSteps);

      sheep.surfaceId = 'taskbar';
      sheep.dir = -1;
      sheep.x = startX;
      sheep.y = startY;
      sheep.anim = 'meteor_bath';
      sheep.stepIdx = 0;
      sheep.stepTimer = 0;
      sheep.offsetY = 0;
      sheep.opacity = 1;
      sheep.sceneData = {
        bathX,
        groundY,
        flightSteps,
        dxPerStep,
        dyPerStep,
        phase: 'flight',
        phaseTick: 0
      };
      sheep.frame = 134;

      this.propsList.push({
        id: this.nextPropId++,
        ownerId: sheep.id,
        type: 'bathtub',
        x: bathX,
        y: groundY,
        frame: 146,
        flipped: false,
        opacity: 1,
        behindSheep: false
      });
      return;
    }

    if (sceneType === 'black_sheep') {
      this.stats.blackSheepMet++;
      this.playSound('baa');
      const meetX = Math.round(Math.max(size * 3, Math.min(screenW - size * 4, sheep.x)));
      sheep.surfaceId = 'taskbar';
      sheep.y = groundY;
      sheep.x = Math.min(screenW - size, meetX + size * 2.5);
      sheep.dir = -1;
      sheep.anim = 'black_sheep';
      sheep.stepIdx = 0;
      sheep.stepTimer = 0;
      sheep.offsetY = 0;
      sheep.opacity = 1;
      sheep.frame = 2;

      const blackProp = {
        id: this.nextPropId++,
        ownerId: sheep.id,
        type: 'blacksheep',
        x: Math.max(0, meetX - size * 2.5),
        y: groundY,
        frame: 154,
        flipped: false,
        opacity: 1,
        behindSheep: true
      };
      this.propsList.push(blackProp);
      sheep.sceneData = {
        meetX,
        groundY,
        phase: 'approach',
        phaseTick: 0,
        prop: blackProp
      };
      return;
    }

    if (sceneType === 'ufo_alien') {
      this.stats.ufoVisits++;
      this.playSound('ufo');
      const baseX = Math.round(Math.max(size * 2, Math.min(screenW - size * 3, sheep.x)));
      sheep.surfaceId = 'taskbar';
      sheep.x = baseX;
      sheep.y = groundY;
      sheep.dir = -1;
      sheep.anim = 'ufo_alien';
      sheep.stepIdx = 0;
      sheep.stepTimer = 0;
      sheep.offsetY = 0;
      sheep.opacity = 1;
      sheep.frame = 73;

      const ufoProp = {
        id: this.nextPropId++,
        ownerId: sheep.id,
        type: 'ufo',
        x: baseX,
        y: -size,
        frame: 158,
        flipped: false,
        opacity: 1,
        beamActive: false
      };
      const alienProp = {
        id: this.nextPropId++,
        ownerId: sheep.id,
        type: 'alien',
        x: baseX - size * 1.1,
        y: groundY - size * 1.6,
        frame: 166,
        flipped: false,
        opacity: 0
      };
      this.propsList.push(ufoProp, alienProp);
      sheep.sceneData = {
        baseX,
        groundY,
        phase: 'descend',
        phaseTick: 0,
        ufoProp,
        alienProp
      };
    }
  }

  updateSpecialScene(sheep, dt) {
    const size = this.getSpriteSize();
    const sd = sheep.sceneData;
    if (!sd) {
      this.setAnim(sheep, 'walk');
      return;
    }

    sheep.stepTimer += dt;
    if (sheep.stepTimer < 65) return;
    sheep.stepTimer = 0;
    sd.phaseTick++;

    if (sheep.anim === 'meteor_bath') {
      const tub = this.propsList.find(p => p.ownerId === sheep.id && p.type === 'bathtub');
      if (sd.phase === 'flight') {
        sheep.x += sd.dxPerStep;
        sheep.y += sd.dyPerStep;
        const progress = Math.min(1, sd.phaseTick / sd.flightSteps);
        const meteorFrames = [134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
        const fIdx = Math.min(meteorFrames.length - 1, Math.floor(progress * meteorFrames.length));
        sheep.frame = meteorFrames[fIdx];

        if (sd.phaseTick % 2 === 0) {
          this.particles.push({
            type: 'fire',
            x: sheep.x + size * 0.65,
            y: sheep.y + size * 0.35,
            vx: 1.2 + Math.random() * 1.5,
            vy: -1.2 - Math.random() * 1.5,
            alpha: 0.95
          });
        }

        if (sd.phaseTick >= sd.flightSteps || sheep.y >= sd.groundY) {
          sheep.x = sd.bathX;
          sheep.y = sd.groundY;
          sheep.frame = 174;
          sd.phase = 'splash';
          sd.phaseTick = 0;
          this.playSound('splash');
        }
      } else if (sd.phase === 'splash') {
        const splashSeq = [147, 147, 148, 148, 148, 147, 147, 146, 146];
        if (tub) tub.frame = splashSeq[Math.min(splashSeq.length - 1, sd.phaseTick)];
        sheep.frame = 174;
        if (sd.phaseTick >= splashSeq.length) {
          sd.phase = 'peek';
          sd.phaseTick = 0;
        }
      } else if (sd.phase === 'peek') {
        if (tub) {
          tub.frame = 146;
          tub.behindSheep = true;
        }
        const peekSeq = [169, 169, 169, 170, 171, 170, 169, 169, 170, 171, 169];
        sheep.frame = peekSeq[Math.min(peekSeq.length - 1, Math.floor(sd.phaseTick / 2))];
        if (sd.phaseTick >= peekSeq.length * 2) {
          sd.phase = 'hop_out';
          sd.phaseTick = 0;
          this.playSound('pop');
        }
      } else if (sd.phase === 'hop_out') {
        const hopSeq = [119, 119, 81, 81, 82, 82, 10, 10];
        const hopOffsets = [-18, -22, -16, -10, -5, -2, 0, 0];
        const idx = Math.min(hopSeq.length - 1, sd.phaseTick);
        sheep.frame = hopSeq[idx];
        sheep.offsetY = hopOffsets[idx];
        if (tub) tub.opacity = Math.max(0, 1 - sd.phaseTick / hopSeq.length);
        if (sd.phaseTick >= hopSeq.length) {
          sheep.offsetY = 0;
          this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
          this.setAnim(sheep, 'walk');
        }
      }
      return;
    }

    if (sheep.anim === 'black_sheep') {
      const bp = sd.prop;
      if (!bp) {
        this.setAnim(sheep, 'walk');
        return;
      }
      const targetWhiteX = sd.meetX + Math.round(size * 0.48);
      const targetBlackX = sd.meetX - Math.round(size * 0.48);

      if (sd.phase === 'approach') {
        let reached = true;
        if (sheep.x > targetWhiteX) {
          sheep.x = Math.max(targetWhiteX, sheep.x - 3);
          sheep.frame = sd.phaseTick % 4 < 2 ? 2 : 3;
          reached = false;
        } else {
          sheep.frame = 3;
        }
        if (bp.x < targetBlackX) {
          bp.x = Math.min(targetBlackX, bp.x + 3);
          bp.frame = sd.phaseTick % 4 < 2 ? 154 : 155;
          reached = false;
        } else {
          bp.frame = 157;
        }
        if (reached) {
          sd.phase = 'blush';
          sd.phaseTick = 0;
        }
      } else if (sd.phase === 'blush') {
        bp.frame = 157;
        const blushSeq = [
          3, 3, 8, 3, 3,
          127, 127, 128, 128, 129, 129,
          130, 130, 130, 130, 130, 130,
          129, 128, 127, 3, 3
        ];
        const idx = Math.min(blushSeq.length - 1, Math.floor(sd.phaseTick / 2));
        sheep.frame = blushSeq[idx];
        if (sd.phaseTick === 12) {
          this.particles.push({
            type: 'heart',
            x: sd.meetX + size * 0.4,
            y: sheep.y - 4,
            vx: 0,
            vy: -0.7,
            alpha: 1
          });
        }
        if (sd.phaseTick >= blushSeq.length * 2) {
          sd.phase = 'fade';
          sd.phaseTick = 0;
        }
      } else if (sd.phase === 'fade') {
        bp.opacity = Math.max(0, 1 - sd.phaseTick / 14);
        if (sd.phaseTick >= 14) {
          this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
          this.setAnim(sheep, 'walk');
        }
      }
      return;
    }

    if (sheep.anim === 'ufo_alien') {
      const ufo = sd.ufoProp;
      const alien = sd.alienProp;
      if (!ufo || !alien) {
        this.setAnim(sheep, 'walk');
        return;
      }
      const hoverY = Math.max(16, sd.groundY - size * 2.4);

      if (sd.phase === 'descend') {
        ufo.y = Math.min(hoverY, ufo.y + 4);
        ufo.frame = 158 + (sd.phaseTick % 4);
        const lookSeq = [73, 74, 75];
        sheep.frame = lookSeq[Math.min(2, Math.floor(sd.phaseTick / 6))];
        if (ufo.y >= hoverY) {
          sd.phase = 'beam_down';
          sd.phaseTick = 0;
          ufo.beamActive = true;
        }
      } else if (sd.phase === 'beam_down') {
        ufo.frame = 162 + (sd.phaseTick % 4);
        alien.opacity = Math.min(1, sd.phaseTick / 10);
        alien.x = ufo.x;
        alien.y = Math.min(sd.groundY, hoverY + size * 0.6 + (sd.phaseTick / 14) * (sd.groundY - hoverY - size * 0.6));
        alien.frame = 166 + (sd.phaseTick % 3);
        sheep.frame = sd.phaseTick % 2 === 0 ? 50 : 51;
        if (sd.phaseTick >= 14) {
          alien.y = sd.groundY;
          sd.phase = 'alien_dance';
          sd.phaseTick = 0;
        }
      } else if (sd.phase === 'alien_dance') {
        ufo.frame = 162 + (sd.phaseTick % 4);
        alien.frame = 166 + (Math.floor(sd.phaseTick / 2) % 3);
        sheep.frame = sd.phaseTick < 10 ? (sd.phaseTick % 2 === 0 ? 50 : 51) : 6;
        if (sd.phaseTick >= 22) {
          sd.phase = 'abduct_lift';
          sd.phaseTick = 0;
          this.playSound('ufo');
        }
      } else if (sd.phase === 'abduct_lift') {
        ufo.frame = 162 + (sd.phaseTick % 4);
        alien.opacity = Math.max(0, 1 - sd.phaseTick / 8);
        alien.y -= 3;
        sheep.y = Math.max(hoverY + size * 0.5, sheep.y - 3.5);
        sheep.frame = [42, 43, 44][sd.phaseTick % 3];
        if (sd.phaseTick >= 18) {
          ufo.beamActive = false;
          sd.phase = 'fly_away';
          sd.phaseTick = 0;
        }
      } else if (sd.phase === 'fly_away') {
        ufo.frame = 158 + (sd.phaseTick % 4);
        ufo.y -= 7;
        ufo.x += 5;
        if (sd.phaseTick >= 10) {
          this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
          sheep.surfaceId = null;
          this.setAnim(sheep, 'fall');
        }
      }
    }
  }

  chooseNextIdleOrWalk(sheep, onWindow) {
    const r = Math.random() * 100;
    if (this.settings.specialEvents && !onWindow && this.propsList.length === 0 && r < 4.5) {
      const scenes = ['meteor_bath', 'black_sheep', 'ufo_alien'];
      return scenes[Math.floor(Math.random() * scenes.length)];
    }
    if (r < 12) return 'run_begin';
    if (r < 19) return 'eat_daisy';
    if (r < 25) return 'sleep1';
    if (r < 29) return 'sleep2';
    if (r < 33) return 'sleep3';
    if (r < 36) return 'sleep4';
    if (r < 40) return 'pee';
    if (r < 45) return 'cartwheel';
    if (r < 49) return 'handstand_spin';
    if (r < 53) return 'barrel_roll';
    if (r < 57) return 'sneeze';
    if (r < 61) return 'bleat';
    if (r < 65) return 'graze';
    if (r < 69) return 'stretch';
    if (r < 72) return 'cry';
    if (r < 76) return 'waddle';
    if (r < 79) return 'wag_tail';
    if (r < 85) return 'rotate';
    return 'walk';
  }

  updateSheep(sheep, dt, platforms) {
    if (sheep === this.draggingSheep) return;

    if (sheep.anim === 'meteor_bath' || sheep.anim === 'black_sheep' || sheep.anim === 'ufo_alien') {
      this.updateSpecialScene(sheep, dt);
      this.syncSingleActor(sheep);
      return;
    }

    const size = this.getSpriteSize();
    const screenW = this.getScreenW();
    const taskbarTop = this.getTaskbarTop();
    const groundY = taskbarTop - size;
    const speedMult = Number(this.settings.speed) || 1;
    const def = this.getAnimDef(sheep.anim);

    if (
      sheep.anim === 'fall' ||
      sheep.anim === 'fall_fast' ||
      sheep.anim === 'jump_down_fall' ||
      sheep.anim === 'slip_win_fall'
    ) {
      const prevY = sheep.y;
      const dy = (def.dy || 5) * (dt / 45) * speedMult;
      const dx = (def.dx || 0) * sheep.dir * (dt / 45) * speedMult;
      sheep.x = Math.max(0, Math.min(screenW - size, sheep.x + dx));
      sheep.y += dy;
      sheep.airTicks++;

      if (sheep.anim === 'fall' && sheep.airTicks > 24) {
        this.setAnim(sheep, 'fall_fast');
      }

      const landed = this.findLandingSurface(sheep, prevY, sheep.y, platforms);
      if (landed) {
        sheep.y = landed.y;
        sheep.surfaceId = landed.id;
        if (sheep.anim === 'fall_fast') this.setAnim(sheep, 'fall_hard');
        else if (sheep.anim === 'jump_down_fall') this.setAnim(sheep, 'jump_down_land');
        else if (sheep.anim === 'slip_win_fall') this.setAnim(sheep, 'slip_win_land');
        else this.setAnim(sheep, 'fall_soft');
      }
      this.syncSingleActor(sheep);
      return;
    }

    if (sheep.anim === 'climb_up') {
      sheep.stepTimer += dt * speedMult;
      if (sheep.stepTimer >= def.interval) {
        sheep.stepTimer = 0;
        sheep.stepIdx = (sheep.stepIdx + 1) % def.frames.length;
        sheep.frame = def.frames[sheep.stepIdx];
        sheep.y += def.dy;
        if (sheep.y <= 0) {
          sheep.y = 0;
          this.setAnim(sheep, 'corner_to_ceiling');
        }
      }
      this.syncSingleActor(sheep);
      return;
    }

    if (sheep.anim === 'ceiling_walk') {
      sheep.stepTimer += dt * speedMult;
      if (sheep.stepTimer >= def.interval) {
        sheep.stepTimer = 0;
        sheep.stepIdx++;
        if (sheep.stepIdx >= def.frames.length) {
          sheep.stepIdx = 0;
          sheep.loopCount++;
          if (Math.random() < 0.18) {
            sheep.surfaceId = null;
            this.setAnim(sheep, 'fall');
            this.syncSingleActor(sheep);
            return;
          }
        }
        sheep.frame = def.frames[sheep.stepIdx];
        if (sheep.frame === 97 || sheep.frame === 98) {
          sheep.x += sheep.dir * def.dx;
        }
        if (sheep.x <= 0 || sheep.x >= screenW - size) {
          sheep.x = Math.max(0, Math.min(screenW - size, sheep.x));
          this.setAnim(sheep, 'ceiling_to_wall');
        }
      }
      this.syncSingleActor(sheep);
      return;
    }

    if (sheep.anim === 'climb_down') {
      sheep.stepTimer += dt * speedMult;
      if (sheep.stepTimer >= def.interval) {
        sheep.stepTimer = 0;
        sheep.stepIdx = (sheep.stepIdx + 1) % def.frames.length;
        sheep.frame = def.frames[sheep.stepIdx];
        sheep.y += def.dy;
        if (sheep.y >= groundY) {
          sheep.y = groundY;
          sheep.surfaceId = 'taskbar';
          this.setAnim(sheep, 'climb_over');
        }
      }
      this.syncSingleActor(sheep);
      return;
    }

    const surface = this.getSurfaceBounds(sheep, platforms);
    if (!surface && sheep.anim !== 'jump' && sheep.anim !== 'jump_down') {
      sheep.surfaceId = null;
      this.propsList = this.propsList.filter(p => p.ownerId !== sheep.id);
      this.setAnim(sheep, 'fall');
      this.syncSingleActor(sheep);
      return;
    }
    if (surface && sheep.anim !== 'jump' && sheep.anim !== 'jump_down') {
      sheep.y = surface.y;
      sheep.surfaceId = surface.id;
    }

    sheep.stepTimer += dt * speedMult;
    if (sheep.stepTimer < def.interval) {
      this.syncSingleActor(sheep);
      return;
    }
    sheep.stepTimer = 0;

    if (def.dx) {
      sheep.x += sheep.dir * def.dx;
    }
    if (def.dySteps && def.dySteps[sheep.stepIdx] !== undefined) {
      sheep.y += def.dySteps[sheep.stepIdx];
    }

    if (def.zzzRange && sheep.stepIdx >= def.zzzRange[0] && sheep.stepIdx <= def.zzzRange[1] && sheep.stepIdx % 3 === 0) {
      this.particles.push({
        type: 'zzz',
        x: sheep.x + size * 0.5,
        y: sheep.y + 4,
        vx: 0.3,
        vy: -0.6,
        alpha: 1
      });
    }

    if (surface && (sheep.anim === 'walk' || sheep.anim === 'run' || sheep.anim === 'run_begin' || sheep.anim === 'barrel_roll')) {
      const hitLeft = sheep.x <= surface.left;
      const hitRight = sheep.x >= surface.right;
      if (hitLeft || hitRight) {
        sheep.x = Math.max(surface.left, Math.min(surface.right, sheep.x));
        if (surface.isWindow) {
          this.setAnim(sheep, 'look_down');
          this.syncSingleActor(sheep);
          return;
        }
        if (sheep.anim === 'run' || sheep.anim === 'run_begin') {
          this.setAnim(sheep, 'boing');
          this.syncSingleActor(sheep);
          return;
        }
        if (this.settings.climbWalls && Math.random() < 0.28) {
          this.setAnim(sheep, 'climb_up');
          this.syncSingleActor(sheep);
          return;
        }
        this.setAnim(sheep, 'rotate');
        this.syncSingleActor(sheep);
        return;
      }
    }

    sheep.stepIdx++;
    if (def.flipAt !== undefined && sheep.stepIdx === def.flipAt) {
      sheep.dir = -sheep.dir;
    }

    if (sheep.stepIdx >= def.frames.length) {
      if (sheep.targetLoops > 0 && sheep.loopCount < sheep.targetLoops) {
        sheep.loopCount++;
        sheep.stepIdx = 0;
        sheep.frame = def.frames[0];
      } else if (sheep.anim === 'look_down') {
        const r = Math.random();
        if (r < 0.38) this.setAnim(sheep, 'jump_down');
        else if (r < 0.68) this.setAnim(sheep, 'slip_win');
        else this.setAnim(sheep, 'rotate');
      } else if (sheep.anim === 'run') {
        const r = Math.random();
        if (r < 0.3) this.setAnim(sheep, 'jump');
        else this.setAnim(sheep, 'run_end');
      } else if (def.next) {
        this.setAnim(sheep, def.next);
      } else {
        const nextAnim = this.chooseNextIdleOrWalk(sheep, Boolean(surface && surface.isWindow));
        this.setAnim(sheep, nextAnim);
      }
    } else {
      sheep.frame = def.frames[sheep.stepIdx];
    }

    this.syncSingleActor(sheep);
  }

  updatePropsAndParticles(dt) {
    for (let i = this.propsList.length - 1; i >= 0; i--) {
      const p = this.propsList[i];
      if (p.frames) {
        p.stepTimer += dt * (Number(this.settings.speed) || 1);
        if (p.stepTimer >= (p.interval || 180)) {
          p.stepTimer = 0;
          p.stepIdx++;
          if (p.stepIdx >= p.frames.length) {
            this.propsList.splice(i, 1);
            continue;
          }
          p.frame = p.frames[p.stepIdx];
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.025;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  scheduleNextFrame() {
    if (!this.enabled) return;
    if (typeof requestAnimationFrame === 'function') {
      this.animId = requestAnimationFrame((now) => {
        const dt = Math.min(100, Math.max(16, now - (this.lastTick || now)));
        this.lastTick = now;
        this.step(dt);
        this.render();
        if (window.clippySystem && typeof window.clippySystem.checkESheep === 'function') {
          window.clippySystem.checkESheep();
        }
        this.scheduleNextFrame();
      });
    }
  }

  step(dt = 50) {
    if (!this.enabled) return;
    const platforms = this.getWindowPlatforms();
    this.applyWindowDragDeltas(platforms);
    for (const sheep of this.sheepList) {
      this.updateSheep(sheep, dt, platforms);
    }
    this.updatePropsAndParticles(dt);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const size = this.getSpriteSize();

    for (const p of this.propsList) {
      if (p.behindSheep) {
        this.drawProp(this.ctx, p, size);
      }
    }

    for (const s of this.sheepList) {
      const flipped = s.dir === 1;
      this.drawTile(
        this.ctx,
        s.frame,
        Math.round(s.x),
        Math.round(s.y + (s.offsetY || 0)),
        size,
        size,
        flipped,
        s.opacity
      );
    }

    for (const p of this.propsList) {
      if (!p.behindSheep) {
        this.drawProp(this.ctx, p, size);
      }
    }

    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
      if (pt.type === 'zzz') {
        this.ctx.fillStyle = '#ffffc0';
        this.ctx.strokeStyle = '#000080';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 11px Tahoma, monospace';
        this.ctx.strokeText('Zzz', Math.round(pt.x), Math.round(pt.y));
        this.ctx.fillText('Zzz', Math.round(pt.x), Math.round(pt.y));
      } else if (pt.type === 'heart') {
        this.ctx.fillStyle = '#ff3366';
        this.ctx.font = 'bold 13px Tahoma, sans-serif';
        this.ctx.fillText('♥', Math.round(pt.x), Math.round(pt.y));
      } else if (pt.type === 'fire') {
        this.ctx.fillStyle = pt.alpha > 0.5 ? '#ff6600' : '#555555';
        this.ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 4, 4);
      }
      this.ctx.restore();
    }
  }

  drawProp(ctx, prop, size) {
    if (prop.type === 'ufo' && prop.beamActive) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.moveTo(prop.x + size * 0.25, prop.y + size * 0.85);
      ctx.lineTo(prop.x + size * 0.75, prop.y + size * 0.85);
      ctx.lineTo(prop.x + size * 1.15, this.getTaskbarTop());
      ctx.lineTo(prop.x - size * 0.15, this.getTaskbarTop());
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    this.drawTile(ctx, prop.frame, Math.round(prop.x), Math.round(prop.y), size, size, prop.flipped, prop.opacity);
  }

  drawTile(ctx, frameIdx, x, y, w, h, flipped = false, opacity = 1) {
    if (!ctx || frameIdx === undefined || frameIdx === null || frameIdx >= 172) return;
    ctx.save();
    if (opacity !== undefined && opacity < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    }
    ctx.translate(x + (flipped ? w : 0), y);
    if (flipped) {
      ctx.scale(-1, 1);
    }
    if (this.spriteLoaded && this.spriteImg && ctx.drawImage) {
      const col = frameIdx % this.cols;
      const row = Math.floor(frameIdx / this.cols);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        this.spriteImg,
        col * this.tileSize,
        row * this.tileSize,
        this.tileSize,
        this.tileSize,
        0,
        0,
        w,
        h
      );
    } else {
      this.drawFallbackTile(ctx, frameIdx, w, h);
    }
    ctx.restore();
  }

  drawFallbackTile(ctx, frameIdx, w, h) {
    const isBlackSheep = frameIdx >= 154 && frameIdx <= 157;
    const isBathtub = frameIdx >= 146 && frameIdx <= 148;
    const isFlower = frameIdx >= 149 && frameIdx <= 153;
    const isUfo = frameIdx >= 158 && frameIdx <= 165;
    const isAlien = frameIdx >= 166 && frameIdx <= 168;
    const isBurning = frameIdx >= 134 && frameIdx <= 145;

    if (isBathtub) {
      ctx.fillStyle = '#ffffc0';
      ctx.fillRect(4, h * 0.5, w - 8, h * 0.4);
      ctx.fillStyle = '#00bfff';
      ctx.fillRect(8, h * 0.35, w - 16, h * 0.2);
      return;
    }
    if (isFlower) {
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(w * 0.45, h * 0.45, 3, h * 0.5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (isUfo) {
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.55, w * 0.4, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(w * 0.3, h * 0.72, w * 0.4, 4);
      return;
    }
    if (isAlien) {
      ctx.fillStyle = '#0066ff';
      ctx.fillRect(w * 0.35, h * 0.25, w * 0.3, h * 0.6);
      return;
    }

    if (isBurning) {
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(w * 0.55, h * 0.45, w * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#222222';
    ctx.fillRect(w * 0.28, h * 0.72, 4, h * 0.22);
    ctx.fillRect(w * 0.62, h * 0.72, 4, h * 0.22);

    ctx.fillStyle = isBurning && frameIdx >= 139 ? '#444444' : '#f7f49d';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w * 0.54, h * 0.54, w * 0.34, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isBlackSheep ? '#222222' : '#f5a673';
    ctx.beginPath();
    ctx.ellipse(w * 0.26, h * 0.48, w * 0.16, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9c27b0';
    ctx.beginPath();
    ctx.arc(w * 0.36, h * 0.36, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w * 0.23, h * 0.45, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(w * 0.22, h * 0.44, 2, 2);
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

      if (type === 'baa') {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(310, now);
        osc.frequency.linearRampToValueAtTime(355, now + 0.08);
        osc.frequency.linearRampToValueAtTime(280, now + 0.36);

        lfo.frequency.setValueAtTime(28, now);
        lfoGain.gain.setValueAtTime(22, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + 0.38);
        lfo.stop(now + 0.38);
      } else if (type === 'boing' || type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'boing' ? 180 : 420, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'boing' ? 540 : 680, now + 0.16);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'thud' || type === 'chomp' || type === 'sneeze' || type === 'splash') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(type === 'sneeze' ? 620 : (type === 'splash' ? 260 : 140), now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'ufo' || type === 'meteor') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'ufo' ? 640 : 880, now);
        osc.frequency.linearRampToValueAtTime(type === 'ufo' ? 920 : 220, now + 0.32);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.34);
      }
    } catch (e) {}
  }

  triggerCommand(cmd, targetSheep = null) {
    if (!this.enabled || this.sheepList.length === 0) {
      this.start(1);
    }
    const sheep = targetSheep || this.sheepList[0];
    if (!sheep) return null;
    this.setAnim(sheep, cmd);
    this.syncSingleActor(sheep);
    this.refreshControlPanel();
    return sheep;
  }

  openContextMenu(x, y, targetSheep = null) {
    if (!window.contextMenu || typeof window.contextMenu.show !== 'function') return;
    const ru = this.isRu();
    const target = targetSheep || this.sheepList[0] || null;

    const menuItems = [
      {
        label: ru ? '⚙️ Свойства: eSheep 98...' : '⚙️ eSheep 98 Properties...',
        bold: true,
        action: () => this.openSettings()
      },
      {
        label: ru ? `➕ Добавить овечку (сейчас: ${this.sheepList.length})` : `➕ Add Sheep (active: ${this.sheepList.length})`,
        action: () => {
          this.spawnSheep();
          this.playSound('baa');
        }
      },
      { separator: true },
      { label: ru ? '🌼 Покормить ромашками' : '🌼 Feed Daisies', action: () => this.triggerCommand('eat_daisy', target) },
      { label: ru ? '☄️ Горящий метеорит и ванна' : '☄️ Meteor & Bathtub', action: () => this.triggerCommand('meteor_bath', target) },
      { label: ru ? '🐑 Встреча с чёрной овечкой' : '🐑 Black Sheep Encounter', action: () => this.triggerCommand('black_sheep', target) },
      { label: ru ? '🛸 Прилёт НЛО и пришельца' : '🛸 UFO & Alien Visit', action: () => this.triggerCommand('ufo_alien', target) },
      { separator: true },
      { label: ru ? '🤸 Сальто / Колесо 360°' : '🤸 360° Cartwheel', action: () => this.triggerCommand('cartwheel', target) },
      { label: ru ? '🌀 Кувырок бочкой' : '🌀 Barrel Roll', action: () => this.triggerCommand('barrel_roll', target) },
      { label: ru ? '🧗 Залезть по стене на потолок' : '🧗 Climb Screen Wall', action: () => this.triggerCommand('climb_up', target) },
      { label: ru ? '💤 Уложить спать' : '💤 Put to Sleep', action: () => this.triggerCommand('sleep1', target) },
      { label: ru ? '🔊 Подать голос («Бе-е!»)' : '🔊 Bleat ("Baa!")', action: () => this.triggerCommand('bleat', target) },
      { separator: true },
      {
        label: ru ? 'ℹ️ О программе eSheep...' : 'ℹ️ About eSheep...',
        action: () => this.openAbout()
      }
    ];

    if (targetSheep) {
      menuItems.push(
        { separator: true },
        {
          label: ru ? `❌ Убрать эту овечку (#${targetSheep.id})` : `❌ Remove This Sheep (#${targetSheep.id})`,
          action: () => this.removeSheep(targetSheep)
        }
      );
    }

    menuItems.push(
      { separator: true },
      {
        label: ru ? '🚪 Убрать всех овечек (Выход)' : '🚪 Remove All Sheep (Exit)',
        action: () => this.stop()
      }
    );

    window.contextMenu.show(x, y, menuItems);
  }

  openAbout() {
    if (!window.winManager) return;
    if (window.winManager.windows.has(this.aboutWinId)) {
      const existing = window.winManager.windows.get(this.aboutWinId);
      if (existing && existing.isMinimized && typeof window.winManager.restoreWindow === 'function') {
        window.winManager.restoreWindow(this.aboutWinId);
      }
      window.winManager.bringToTop(this.aboutWinId);
      return;
    }
    const ru = this.isRu();
    const html = `
      <div style="padding:14px; font-family:var(--win-font); font-size:11px; display:flex; flex-direction:column; gap:10px; height:100%; box-sizing:border-box; justify-content:space-between;">
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div style="width:40px; height:40px; flex-shrink:0;">${(typeof Icons !== 'undefined' && Icons['esheep']) ? Icons['esheep'] : ''}</div>
          <div style="line-height:1.45;">
            <div style="font-size:13px; font-weight:bold; color:#000080;">eSheep 98 (Screen Mate Sheep.exe)</div>
            <div>${ru ? 'Версия 1.8 для Microslop Win 98 SE (Freeware)' : 'Version 1.8 for Microslop Win 98 SE (Freeware)'}</div>
            <div style="color:#444; margin-top:4px;">
              ${ru
                ? 'Персонаж: овечка По (Stray Sheep Poe) — Fuji Television / Tatsutoshi Nomura (1994–1995).'
                : 'Character: Stray Sheep Poe — Fuji Television / Tatsutoshi Nomura (1994–1995).'}
            </div>
            <div style="color:#444; margin-top:4px;">
              ${ru
                ? 'Перетаскивайте овечку мышью на заголовки любых открытых окон, дважды щёлкайте по ней или вызывайте контекстное меню правой кнопкой мыши.'
                : 'Drag the sheep with your mouse onto any open window title bar, double-click it, or right-click for the context menu.'}
            </div>
          </div>
        </div>
        <div style="border:2px groove #dfdfdf; padding:6px 8px; background:#f4f4f0; display:grid; grid-template-columns:1fr 1fr; gap:3px 12px;">
          <span>${ru ? 'Выпущено овечек:' : 'Sheep spawned:'} <b>${this.stats.spawned}</b></span>
          <span>${ru ? 'Съедено ромашек:' : 'Daisies eaten:'} <b>${this.stats.daisiesEaten}</b></span>
          <span>${ru ? 'Падений в ванну:' : 'Meteor baths:'} <b>${this.stats.bathsTaken}</b></span>
          <span>${ru ? 'Встреч с НЛО:' : 'UFO visits:'} <b>${this.stats.ufoVisits}</b></span>
        </div>
        <div style="display:flex; justify-content:flex-end;">
          <button class="win-btn" id="btn_esheep_about_ok" style="min-width:80px; font-weight:bold;">OK</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.aboutWinId,
      title: ru ? 'О программе eSheep 98' : 'About eSheep 98',
      icon: 'esheep',
      width: 380,
      height: 245,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: html
    });

    const okBtn = win.element.querySelector('#btn_esheep_about_ok');
    if (okBtn) {
      okBtn.addEventListener('click', () => window.winManager.closeWindow(this.aboutWinId));
    }
  }

  openSettings() {
    if (!window.winManager) return;
    if (window.winManager.windows.has(this.propsWinId)) {
      const existing = window.winManager.windows.get(this.propsWinId);
      if (existing && existing.isMinimized && typeof window.winManager.restoreWindow === 'function') {
        window.winManager.restoreWindow(this.propsWinId);
      }
      window.winManager.bringToTop(this.propsWinId);
      this.refreshControlPanel();
      return;
    }

    const ru = this.isRu();
    const content = document.createElement('div');
    content.className = 'esheep-cp-root';
    content.innerHTML = `
      <div class="esheep-cp-stage-wrap">
        <div class="esheep-cp-stage">
          <div class="esheep-cp-stage-caption">SHEEP.EXE (16x11)</div>
          <canvas id="esheep_cp_preview" width="152" height="100" title="${ru ? 'Нажмите для смены анимации' : 'Click to cycle preview animation'}"></canvas>
        </div>
        <div class="esheep-cp-summary">
          <div class="esheep-cp-title-row">
            <span>eSheep 98 — Stray Sheep Poe</span>
          </div>
          <div class="esheep-cp-stat-grid">
            <span>${ru ? 'На экране:' : 'Active:'}</span>
            <span id="esheep_cp_count">${this.sheepList.length}</span>
            <span>${ru ? 'Состояние:' : 'State:'}</span>
            <span id="esheep_cp_state">${this.enabled ? (ru ? 'Гуляет по экрану' : 'Roaming') : (ru ? 'Спит в загоне' : 'Stopped')}</span>
            <span>${ru ? 'Ромашек / Ванн:' : 'Daisies / Baths:'}</span>
            <span id="esheep_cp_stats">${this.stats.daisiesEaten} / ${this.stats.bathsTaken}</span>
          </div>
          <div class="esheep-cp-flock-bar">
            <button class="win-btn" data-esheep-act="add"><b>+ ${ru ? 'Овечка' : 'Sheep'}</b></button>
            <button class="win-btn" data-esheep-act="remove">&minus; 1</button>
            <button class="win-btn" data-esheep-act="baa">🔊 ${ru ? 'Бе-е!' : 'Baa!'}</button>
          </div>
        </div>
      </div>

      <fieldset class="esheep-cp-group">
        <legend>${ru ? 'Сценки и трюки (выполнить сейчас)' : 'Scenes & Tricks (Trigger Now)'}</legend>
        <div class="esheep-cp-tricks">
          <button class="win-btn" data-esheep-cmd="eat_daisy">🌼 ${ru ? 'Ромашки' : 'Daisies'}</button>
          <button class="win-btn" data-esheep-cmd="meteor_bath">☄️ ${ru ? 'Метеорит и ванна' : 'Meteor Bath'}</button>
          <button class="win-btn" data-esheep-cmd="black_sheep">🐑 ${ru ? 'Чёрная овечка' : 'Black Sheep'}</button>
          <button class="win-btn" data-esheep-cmd="ufo_alien">🛸 ${ru ? 'НЛО и пришелец' : 'UFO & Alien'}</button>
          <button class="win-btn" data-esheep-cmd="cartwheel">🤸 ${ru ? 'Сальто 360°' : 'Cartwheel'}</button>
          <button class="win-btn" data-esheep-cmd="barrel_roll">🌀 ${ru ? 'Бочка' : 'Barrel Roll'}</button>
          <button class="win-btn" data-esheep-cmd="climb_up">🧗 ${ru ? 'На потолок' : 'Climb Wall'}</button>
          <button class="win-btn" data-esheep-cmd="pee">💧 ${ru ? 'Пошалить' : 'Pee'}</button>
          <button class="win-btn" data-esheep-cmd="sleep1">💤 ${ru ? 'Уснуть' : 'Sleep'}</button>
        </div>
      </fieldset>

      <fieldset class="esheep-cp-group">
        <legend>${ru ? 'Поведение и физика рабочего стола' : 'Desktop Physics & Behavior'}</legend>
        <div class="esheep-cp-checks">
          <label class="esheep-cp-check">
            <input type="checkbox" data-esheep-opt="walkOnWindows" ${this.settings.walkOnWindows ? 'checked' : ''}>
            <span>${ru ? 'Ходить по заголовкам окон' : 'Walk on open window tops'}</span>
          </label>
          <label class="esheep-cp-check">
            <input type="checkbox" data-esheep-opt="climbWalls" ${this.settings.climbWalls ? 'checked' : ''}>
            <span>${ru ? 'Лазать по стенам и потолку' : 'Climb screen edges & ceiling'}</span>
          </label>
          <label class="esheep-cp-check">
            <input type="checkbox" data-esheep-opt="specialEvents" ${this.settings.specialEvents ? 'checked' : ''}>
            <span>${ru ? 'Случайные сценки (НЛО, ванна)' : 'Random special scenes'}</span>
          </label>
          <label class="esheep-cp-check">
            <input type="checkbox" data-esheep-opt="sound" ${this.settings.sound ? 'checked' : ''}>
            <span>${ru ? 'Звуковые эффекты («Бе-е!»)' : 'Sound effects ("Baa!")'}</span>
          </label>
          <label class="esheep-cp-check">
            <input type="checkbox" data-esheep-opt="autoStart" ${this.settings.autoStart ? 'checked' : ''}>
            <span>${ru ? 'Запускать вместе с Win 98' : 'Start automatically with Win 98'}</span>
          </label>
        </div>
        <div class="esheep-cp-sliders">
          <div class="esheep-cp-sliders-item">
            <span>${ru ? 'Размер:' : 'Scale:'}</span>
            <select class="esheep-cp-select" data-esheep-select="scale">
              <option value="1" ${Number(this.settings.scale) === 1 ? 'selected' : ''}>1x (40x40 px)</option>
              <option value="1.5" ${Number(this.settings.scale) === 1.5 ? 'selected' : ''}>1.5x (60x60 px)</option>
              <option value="2" ${Number(this.settings.scale) === 2 ? 'selected' : ''}>2x (80x80 px)</option>
            </select>
          </div>
          <div class="esheep-cp-sliders-item">
            <span>${ru ? 'Скорость:' : 'Speed:'}</span>
            <select class="esheep-cp-select" data-esheep-select="speed">
              <option value="0.75" ${Number(this.settings.speed) === 0.75 ? 'selected' : ''}>0.75x</option>
              <option value="1" ${Number(this.settings.speed) === 1 ? 'selected' : ''}>1.0x</option>
              <option value="1.5" ${Number(this.settings.speed) === 1.5 ? 'selected' : ''}>1.5x</option>
              <option value="2" ${Number(this.settings.speed) === 2 ? 'selected' : ''}>2.0x</option>
            </select>
          </div>
        </div>
      </fieldset>

      <div class="esheep-cp-footer">
        <div class="esheep-cp-footer-left">
          <button class="win-btn" data-esheep-act="about">${ru ? 'О программе...' : 'About...'}</button>
          <button class="win-btn" data-esheep-act="stop">${ru ? 'Убрать всех' : 'Remove All'}</button>
        </div>
        <div class="esheep-cp-footer-right">
          <button class="win-btn" data-esheep-act="close" style="font-weight:bold;">OK</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.propsWinId,
      title: ru ? 'Свойства: eSheep 98 (Sheep.exe)' : 'eSheep 98 Properties (Sheep.exe)',
      icon: 'esheep',
      width: 438,
      height: 424,
      resizable: false,
      minimizable: true,
      maximizable: false,
      isDialog: true,
      content,
      onClose: () => {
        if (this.previewAnimId && typeof clearInterval === 'function') {
          clearInterval(this.previewAnimId);
          this.previewAnimId = null;
        }
      }
    });

    const el = win.element;

    el.querySelectorAll('[data-esheep-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.esheepCmd;
        this.previewAction = cmd;
        this.triggerCommand(cmd);
      });
    });

    el.querySelectorAll('input[data-esheep-opt]').forEach(chk => {
      chk.addEventListener('change', () => {
        this.settings[chk.dataset.esheepOpt] = Boolean(chk.checked);
        this.saveSettings();
      });
    });

    el.querySelectorAll('select[data-esheep-select]').forEach(sel => {
      sel.addEventListener('change', () => {
        this.settings[sel.dataset.esheepSelect] = Number(sel.value) || 1;
        this.saveSettings();
      });
    });

    el.querySelector('[data-esheep-act="add"]').addEventListener('click', () => {
      this.spawnSheep();
      this.playSound('baa');
    });

    el.querySelector('[data-esheep-act="remove"]').addEventListener('click', () => {
      if (this.sheepList.length > 0) {
        this.removeSheep(this.sheepList[this.sheepList.length - 1]);
      }
    });

    el.querySelector('[data-esheep-act="baa"]').addEventListener('click', () => {
      this.triggerCommand('bleat');
    });

    el.querySelector('[data-esheep-act="about"]').addEventListener('click', () => {
      this.openAbout();
    });

    el.querySelector('[data-esheep-act="stop"]').addEventListener('click', () => {
      this.stop();
    });

    el.querySelector('[data-esheep-act="close"]').addEventListener('click', () => {
      window.winManager.closeWindow(this.propsWinId);
    });

    const previewCanvas = el.querySelector('#esheep_cp_preview');
    if (previewCanvas) {
      const previewModes = ['walk', 'eat_daisy', 'cartwheel', 'meteor_bath', 'ufo_alien', 'black_sheep', 'sleep1'];
      previewCanvas.addEventListener('click', () => {
        const idx = (previewModes.indexOf(this.previewAction) + 1) % previewModes.length;
        this.previewAction = previewModes[idx];
        this.playSound('pop');
      });
      this.startPreviewLoop(previewCanvas);
    }
  }

  startPreviewLoop(canvas) {
    if (this.previewAnimId && typeof clearInterval === 'function') {
      clearInterval(this.previewAnimId);
    }
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const renderPreview = () => {
      this.previewTick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#dfdfdf';
      ctx.fillRect(10, 70, 132, 30);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(12, 72, 128, 28);
      ctx.fillStyle = '#000080';
      ctx.fillRect(13, 73, 126, 13);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Tahoma, sans-serif';
      ctx.fillText('Microslop Win 98', 17, 83);

      const standY = 30;
      const def = this.getAnimDef(this.previewAction);
      const frames = def && def.frames ? def.frames : [2, 3];
      const f = frames[this.previewTick % frames.length];
      this.drawTile(ctx, f, 58, standY, 40, 40, false, 1);

      if (this.previewAction === 'eat_daisy') {
        this.drawTile(ctx, 153, 22, standY, 40, 40, false, 1);
      } else if (this.previewAction === 'meteor_bath') {
        this.drawTile(ctx, 147, 58, standY, 40, 40, false, 1);
        this.drawTile(ctx, 136, 98, 12, 40, 40, false, 1);
      } else if (this.previewAction === 'black_sheep') {
        this.drawTile(ctx, 157, 20, standY, 40, 40, false, 1);
        this.drawTile(ctx, 128, 58, standY, 40, 40, false, 1);
      } else if (this.previewAction === 'ufo_alien') {
        this.drawTile(ctx, 163, 58, 8, 40, 40, false, 1);
        this.drawTile(ctx, 166 + (this.previewTick % 3), 20, standY, 40, 40, false, 1);
      }
    };
    renderPreview();
    if (typeof setInterval === 'function') {
      this.previewAnimId = setInterval(renderPreview, 160);
    }
  }

  refreshControlPanel() {
    if (!window.winManager || !window.winManager.windows.has(this.propsWinId)) return;
    const win = window.winManager.windows.get(this.propsWinId);
    if (!win || !win.element) return;
    const el = win.element;
    const ru = this.isRu();
    const countEl = el.querySelector('#esheep_cp_count');
    const stateEl = el.querySelector('#esheep_cp_state');
    const statsEl = el.querySelector('#esheep_cp_stats');
    if (countEl) countEl.textContent = String(this.sheepList.length);
    if (stateEl) {
      const first = this.sheepList[0];
      stateEl.textContent = this.enabled && first
        ? `${first.anim} (${first.surfaceId === 'taskbar' ? (ru ? 'Панель задач' : 'Taskbar') : (first.surfaceId || (ru ? 'В воздухе' : 'Air'))})`
        : (ru ? 'Остановлена' : 'Stopped');
    }
    if (statsEl) {
      statsEl.textContent = `${this.stats.daisiesEaten} / ${this.stats.bathsTaken}`;
    }
  }

  processList() {
    if (!this.isRunning()) return [];
    return [
      {
        pid: 948,
        imageName: 'sheep.exe',
        cpu: Math.min(4.5, Math.round(this.sheepList.length * 0.4 * 10) / 10),
        mem: 1420 + this.sheepList.length * 180,
        priority: 'Normal',
        user: 'User',
        isCritical: false,
        isESheep: true
      }
    ];
  }
}

window.appESheep = new AppESheep();
