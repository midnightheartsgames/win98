class WindowManager {
  constructor() {
    this.windows = new Map();
    this.activeWindowId = null;
    this.highestZIndex = 100;
    this.desktopEl = document.getElementById('desktop');
    this.initGlobalListeners();
  }

  initGlobalListeners() {
    this.desktopEl.addEventListener('mousedown', (e) => {
      if (e.target === this.desktopEl || e.target.id === 'desktop-icons') {
        this.deactivateAll();
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest || !e.target.closest('.win-menubar')) {
        document.querySelectorAll('.win-menu-item.active').forEach(m => m.classList.remove('active'));
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.win-menu-item.active').forEach(m => m.classList.remove('active'));
        this.hideAltTabSwitcher();
      }
      this.handleGlobalShortcuts(e);
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Alt' && this.altTabState && this.altTabState.active) {
        this.commitAltTabSelection();
      }
    });

    window.addEventListener('beforeunload', () => {
      ['app_ie', 'app_explorer', 'app_netscape'].forEach(id => {
        if (this.windows && this.windows.has(id)) {
          this.saveWindowBounds(id);
        }
      });
    });
  }

  handleGlobalShortcuts(e) {
    if (e.key === 'Shift' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const now = Date.now();
      if (!this.shiftPressTimes) this.shiftPressTimes = [];
      this.shiftPressTimes = this.shiftPressTimes.filter(t => now - t < 2500);
      this.shiftPressTimes.push(now);
      if (this.shiftPressTimes.length >= 5) {
        this.shiftPressTimes = [];
        if (window.appCPanel && typeof window.appCPanel.openStickyKeysPrompt === 'function') {
          window.appCPanel.openStickyKeysPrompt();
        }
      }
      return;
    }
    if (e.key !== 'Shift' && this.shiftPressTimes) {
      this.shiftPressTimes = [];
    }

    if (e.altKey && (e.key === 'Tab' || e.key === '`')) {
      e.preventDefault();
      this.cycleAltTab(e.shiftKey ? -1 : 1);
      return;
    }

    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      if (this.activeWindowId && this.windows.has(this.activeWindowId)) {
        this.closeWindow(this.activeWindowId);
      } else if (window.appShutdown && typeof window.appShutdown.openDialog === 'function') {
        window.appShutdown.openDialog();
      }
      return;
    }

    if ((e.ctrlKey && e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) || (e.ctrlKey && e.shiftKey && e.key === 'Escape')) {
      e.preventDefault();
      if (window.appTaskManager && typeof window.appTaskManager.open === 'function') {
        window.appTaskManager.open();
      }
      return;
    }

    const isWinChord = e.metaKey || (e.ctrlKey && e.altKey);
    if (isWinChord && !e.shiftKey) {
      const k = (e.key || '').toLowerCase();
      if (k === 'r') {
        e.preventDefault();
        if (window.appDialogs && typeof window.appDialogs.openRunDialog === 'function') {
          window.appDialogs.openRunDialog();
        }
      } else if (k === 'e') {
        e.preventDefault();
        if (window.appExplorer && typeof window.appExplorer.open === 'function') {
          window.appExplorer.open(['My Computer'], { showTree: true });
        }
      } else if (k === 'd' || k === 'm') {
        e.preventDefault();
        if (window.taskbar && typeof window.taskbar.toggleShowDesktop === 'function') {
          window.taskbar.toggleShowDesktop();
        } else {
          this.minimizeAll();
        }
      }
    }
  }

  cycleAltTab(step = 1) {
    const list = Array.from(this.windows.values()).sort((a, b) => (parseInt(b.element.style.zIndex || 0, 10)) - (parseInt(a.element.style.zIndex || 0, 10)));
    if (list.length === 0) return;

    if (!this.altTabState || !this.altTabState.active) {
      this.altTabState = {
        active: true,
        list,
        index: list.length > 1 ? 1 : 0
      };
    } else {
      this.altTabState.list = list;
      this.altTabState.index = (this.altTabState.index + step + list.length) % list.length;
    }

    let switcher = document.getElementById('alt-tab-switcher');
    if (!switcher && document.body) {
      switcher = document.createElement('div');
      switcher.id = 'alt-tab-switcher';
      document.body.appendChild(switcher);
    }
    if (!switcher) return;

    const selectedWin = this.altTabState.list[this.altTabState.index] || this.altTabState.list[0];
    switcher.innerHTML = `
      <div class="alt-tab-icons">
        ${this.altTabState.list.map((w, idx) => `
          <div class="alt-tab-icon${idx === this.altTabState.index ? ' selected' : ''}" data-win-id="${w.id}">
            ${(typeof Icons !== 'undefined' && Icons[w.icon]) || (typeof Icons !== 'undefined' && Icons['notepad']) || ''}
          </div>
        `).join('')}
      </div>
      <div class="alt-tab-title">${selectedWin ? selectedWin.title : ''}</div>
    `;
    switcher.classList.add('active');
    switcher.querySelectorAll('.alt-tab-icon').forEach((iconEl, idx) => {
      iconEl.addEventListener('click', () => {
        this.altTabState.index = idx;
        this.commitAltTabSelection();
      });
    });
  }

  commitAltTabSelection() {
    if (!this.altTabState || !this.altTabState.active) return;
    const target = this.altTabState.list[this.altTabState.index];
    this.hideAltTabSwitcher();
    if (target && this.windows.has(target.id)) {
      if (target.isMinimized) {
        this.restoreWindow(target.id);
      } else {
        this.bringToTop(target.id);
      }
    }
  }

  closeAllWindows() {
    Array.from(this.windows.keys()).forEach(id => {
      const win = this.windows.get(id);
      if (!win) return;
      win.beforeClose = null;
      this.closeWindow(id);
    });
    this.hideAltTabSwitcher();
    this.activeWindowId = null;
  }

  hideAltTabSwitcher() {
    if (this.altTabState) this.altTabState.active = false;
    const switcher = document.getElementById('alt-tab-switcher');
    if (switcher) switcher.classList.remove('active');
  }

  deactivateAll() {
    this.windows.forEach(win => {
      win.element.classList.remove('active');
    });
    this.activeWindowId = null;
    if (window.taskbar) window.taskbar.updateActiveState(null);
  }

  bringToTop(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (this.activeWindowId !== id) {
      this.windows.forEach(w => w.element.classList.remove('active'));
      win.element.classList.add('active');
      this.activeWindowId = id;
    }

    this.highestZIndex += 2;
    win.element.style.zIndex = this.highestZIndex;

    if (window.taskbar) {
      window.taskbar.updateActiveState(id);
    }
  }

  isTopWindow(id) {
    return this.activeWindowId === id;
  }

  setTitle(id, title) {
    const win = this.windows.get(id);
    if (!win) return;
    win.title = title;
    win.titleElement.textContent = title;
    const btn = document.getElementById('taskbar-btn-' + id);
    if (!btn) return;
    btn.title = title;
    const label = btn.querySelector('.taskbar-item-title');
    if (label) label.textContent = title;
  }

  saveWindowBounds(id) {
    const trackedApps = ['app_ie', 'app_explorer', 'app_netscape'];
    if (!trackedApps.includes(id)) return;
    const win = this.windows.get(id);
    if (!win || !win.element) return;

    try {
      let width, height, x, y;
      if (win.isMaximized && win.prevBounds) {
        width = Math.round(win.prevBounds.width);
        height = Math.round(win.prevBounds.height);
        x = Math.round(win.prevBounds.x);
        y = Math.round(win.prevBounds.y);
      } else {
        const rect = win.element.getBoundingClientRect();
        width = Math.round(rect.width);
        height = Math.round(rect.height);
        x = Math.round(rect.left);
        y = Math.round(rect.top);
      }
      if (!width || !height) return;

      const bounds = {
        width,
        height,
        x,
        y,
        isMaximized: !!win.isMaximized
      };
      localStorage.setItem('win98_bounds_' + id, JSON.stringify(bounds));
      if (id === 'app_ie') localStorage.setItem('win98_ie_window_bounds', JSON.stringify(bounds));
      if (id === 'app_explorer') localStorage.setItem('win98_explorer_window_bounds', JSON.stringify(bounds));
      if (id === 'app_netscape') localStorage.setItem('win98_netscape_window_bounds', JSON.stringify(bounds));
    } catch (e) {
      console.warn('Failed to save window bounds for', id, e);
    }
  }

  getSavedWindowBounds(id) {
    const trackedApps = ['app_ie', 'app_explorer', 'app_netscape'];
    if (!trackedApps.includes(id)) return null;

    try {
      let raw = localStorage.getItem('win98_bounds_' + id);
      if (!raw) {
        if (id === 'app_ie') raw = localStorage.getItem('win98_ie_window_bounds');
        else if (id === 'app_explorer') raw = localStorage.getItem('win98_explorer_window_bounds');
        else if (id === 'app_netscape') raw = localStorage.getItem('win98_netscape_window_bounds');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  }

  rememberControls(root, key, selector = 'input, select') {
    const storageKey = 'win98_controls_' + key;
    const controls = [...root.querySelectorAll(selector)].filter(c => !['button', 'submit', 'reset', 'file'].includes(c.type));
    const isToggle = c => c.type === 'checkbox' || c.type === 'radio';
    const read = c => isToggle(c) ? c.checked : c.value;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(saved) && saved.length === controls.length) {
        controls.forEach((c, i) => {
          const value = saved[i];
          if (read(c) === value || typeof value !== (isToggle(c) ? 'boolean' : 'string')) return;
          if (c.type === 'radio' && !value) return;
          if (isToggle(c)) c.checked = value;
          else c.value = value;
          c.dispatchEvent(new Event('input', { bubbles: true }));
          c.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    } catch (e) {}
    return () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(controls.map(read)));
      } catch (e) {}
    };
  }

  createWindow(options = {}) {
    const id = options.id || 'win_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    if (this.windows.has(id)) {
      const existing = this.windows.get(id);
      if (existing.isMinimized) {
        this.restoreWindow(id);
      } else {
        this.bringToTop(id);
      }
      return existing;
    }

    let {
      title = 'Application',
      icon = 'notepad',
      width = 460,
      height = 320,
      minWidth = 180,
      minHeight = 120,
      x = 50 + (this.windows.size * 25) % 250,
      y = 40 + (this.windows.size * 25) % 180,
      resizable = true,
      minimizable = true,
      maximizable = true,
      helpButton = false,
      onHelp = null,
      isDialog = false,
      content = '',
      onClose = null
    } = options;

    const savedBounds = this.getSavedWindowBounds(id);
    let shouldMaximizeOnCreate = false;
    if (savedBounds) {
      if (typeof savedBounds.width === 'number' && savedBounds.width >= 200) {
        width = Math.min(Math.max(savedBounds.width, 200), (window.innerWidth ? window.innerWidth - 20 : 1920));
      }
      if (typeof savedBounds.height === 'number' && savedBounds.height >= 150) {
        height = Math.min(Math.max(savedBounds.height, 150), (window.innerHeight ? window.innerHeight - 40 : 1080));
      }
      if (typeof savedBounds.x === 'number') {
        x = Math.max(0, Math.min((window.innerWidth || 1024) - 100, savedBounds.x));
      }
      if (typeof savedBounds.y === 'number') {
        y = Math.max(0, Math.min((window.innerHeight || 768) - 100, savedBounds.y));
      }
      if (savedBounds.isMaximized && resizable && maximizable) {
        shouldMaximizeOnCreate = true;
      }
    }

    const winEl = document.createElement('div');
    winEl.className = 'win-window' + (isDialog ? ' is-dialog' : '');
    winEl.id = id;
    winEl.style.width = typeof width === 'number' ? (width + 'px') : width;
    winEl.style.height = typeof height === 'number' ? (height + 'px') : height;
    winEl.style.minWidth = typeof minWidth === 'number' ? (minWidth + 'px') : minWidth;
    winEl.style.minHeight = typeof minHeight === 'number' ? (minHeight + 'px') : minHeight;
    winEl.style.left = x + 'px';
    winEl.style.top = y + 'px';
    winEl.style.zIndex = ++this.highestZIndex;

    const titlebar = document.createElement('div');
    titlebar.className = 'win-titlebar';

    const titleLeft = document.createElement('div');
    titleLeft.className = 'win-titlebar-left';
    titleLeft.innerHTML = `
      <div class="win-titlebar-icon">${Icons[icon] || Icons['notepad']}</div>
      <div class="win-titlebar-title">${title}</div>
    `;

    const controls = document.createElement('div');
    controls.className = 'win-titlebar-controls';

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    if (minimizable) {
      const btnMin = document.createElement('button');
      btnMin.className = 'win-control-btn btn-min';
      btnMin.innerHTML = Icons['cap-min'];
      btnMin.title = t('win.minimize');
      btnMin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimizeWindow(id);
      });
      controls.appendChild(btnMin);
    }

    if (maximizable) {
      const btnMax = document.createElement('button');
      btnMax.className = 'win-control-btn btn-max';
      btnMax.innerHTML = Icons['cap-max'];
      btnMax.title = t('win.maximize');
      btnMax.disabled = !resizable;
      btnMax.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMaximize(id);
      });
      controls.appendChild(btnMax);
    }

    if (helpButton || onHelp) {
      const btnHelp = document.createElement('button');
      btnHelp.className = 'win-control-btn btn-help';
      btnHelp.innerHTML = Icons['cap-help'] || '?';
      btnHelp.title = t('start.help');
      btnHelp.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof onHelp === 'function') onHelp(e);
      });
      controls.appendChild(btnHelp);
    }

    const btnClose = document.createElement('button');
    btnClose.className = 'win-control-btn btn-close';
    btnClose.innerHTML = Icons['cap-close'];
    btnClose.title = t('win.close');
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(id);
    });
    controls.appendChild(btnClose);

    titlebar.appendChild(titleLeft);
    titlebar.appendChild(controls);
    winEl.appendChild(titlebar);

    titlebar.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showSystemMenu(id, e.clientX, e.clientY);
    });

    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.win-control-btn') || e.target.closest('.win-titlebar-icon')) return;
      if (maximizable && resizable) this.toggleMaximize(id);
    });

    const titleIcon = titleLeft.querySelector('.win-titlebar-icon');
    let iconClickTimer = null;
    titleIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(iconClickTimer);
      const rect = titlebar.getBoundingClientRect();
      iconClickTimer = setTimeout(() => this.showSystemMenu(id, rect.left, rect.bottom), 250);
    });
    titleIcon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      clearTimeout(iconClickTimer);
      if (window.contextMenu) window.contextMenu.hide();
      this.closeWindow(id);
    });

    const bodyEl = document.createElement('div');
    bodyEl.className = 'win-window-body';
    if (typeof content === 'string') {
      bodyEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      bodyEl.appendChild(content);
    }
    winEl.appendChild(bodyEl);

    if (resizable) {
      const handles = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
      handles.forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `win-resize-handle win-resize-${dir}`;
        handle.dataset.direction = dir;
        winEl.appendChild(handle);
      });
    }

    this.desktopEl.appendChild(winEl);

    const winObj = {
      id,
      title,
      icon,
      element: winEl,
      bodyElement: bodyEl,
      body: bodyEl,
      titleElement: titleLeft.querySelector('.win-titlebar-title'),
      isMaximized: false,
      isMinimized: false,
      prevBounds: { x, y, width, height },
      resizable,
      minWidth: typeof minWidth === 'number' ? minWidth : parseInt(minWidth, 10) || 180,
      minHeight: typeof minHeight === 'number' ? minHeight : parseInt(minHeight, 10) || 120,
      onClose,
      close: () => this.closeWindow(id)
    };

    this.windows.set(id, winObj);

    this.setupMenubarInteractions(winEl);

    this.attachDrag(winObj, titlebar);
    if (resizable) {
      this.attachResize(winObj);
    }

    winEl.addEventListener('mousedown', () => {
      this.bringToTop(id);
    });

    this.bringToTop(id);

    if (window.taskbar && !isDialog) {
      window.taskbar.addWindow(winObj);
    }

    if (shouldMaximizeOnCreate) {
      this.toggleMaximize(id);
    }

    return winObj;
  }

  effectOn(className) {
    const list = typeof document !== 'undefined' && document.body && document.body.classList;
    return Boolean(list && typeof list.contains === 'function' && list.contains(className));
  }

  placeDragFrame(frame, box) {
    frame.style.left = box.left + 'px';
    frame.style.top = box.top + 'px';
    frame.style.width = box.width + 'px';
    frame.style.height = box.height + 'px';
  }

  openDragFrame() {
    if (!this.effectOn('fx-outline-drag')) return null;
    const frame = document.createElement('div');
    frame.className = 'win-drag-outline';
    document.body.appendChild(frame);
    return frame;
  }

  attachDrag(win, handleEl) {
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    const onMouseDown = (e) => {
      if (win.isMaximized) return;
      if (e.target.closest('.win-control-btn') || e.target.closest('.win-titlebar-icon')) return;

      this.bringToTop(win.id);
      startX = e.clientX;
      startY = e.clientY;

      const rect = win.element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      const outline = this.effectOn('fx-outline-drag');
      let frame = null;
      let pending = null;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        newTop = Math.max(0, Math.min(window.innerHeight - 50, newTop));
        newLeft = Math.max(-win.element.offsetWidth + 100, Math.min(window.innerWidth - 100, newLeft));

        if (outline) {
          if (!frame) frame = this.openDragFrame();
          pending = { left: newLeft, top: newTop };
          if (frame) this.placeDragFrame(frame, { left: newLeft, top: newTop, width: rect.width, height: rect.height });
          return;
        }

        win.element.style.left = newLeft + 'px';
        win.element.style.top = newTop + 'px';
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (frame) frame.remove();
        if (pending) {
          win.element.style.left = pending.left + 'px';
          win.element.style.top = pending.top + 'px';
        }
        this.saveWindowBounds(win.id);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    handleEl.addEventListener('mousedown', onMouseDown);
  }

  attachResize(win) {
    const handles = win.element.querySelectorAll('.win-resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.bringToTop(win.id);

        const dir = handle.dataset.direction;
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = win.element.getBoundingClientRect();

        const startW = rect.width;
        const startH = rect.height;
        const startL = rect.left;
        const startT = rect.top;
        const outline = this.effectOn('fx-outline-drag');
        let frame = null;
        let pending = null;

        const onMouseMove = (moveEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;

          let newW = startW;
          let newH = startH;
          let newL = startL;
          let newT = startT;

          const minW = win.minWidth || 180;
          const minH = win.minHeight || 120;

          if (dir.includes('e')) newW = Math.max(minW, startW + dx);
          if (dir.includes('s')) newH = Math.max(minH, startH + dy);
          if (dir.includes('w')) {
            const potentialW = startW - dx;
            if (potentialW >= minW) {
              newW = potentialW;
              newL = startL + dx;
            }
          }
          if (dir.includes('n')) {
            const potentialH = startH - dy;
            if (potentialH >= minH) {
              newH = potentialH;
              newT = startT + dy;
            }
          }

          if (outline) {
            if (!frame) frame = this.openDragFrame();
            pending = { left: newL, top: newT, width: newW, height: newH };
            if (frame) this.placeDragFrame(frame, pending);
            return;
          }

          win.element.style.width = newW + 'px';
          win.element.style.height = newH + 'px';
          win.element.style.left = newL + 'px';
          win.element.style.top = newT + 'px';
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          if (frame) frame.remove();
          if (pending) {
            win.element.style.width = pending.width + 'px';
            win.element.style.height = pending.height + 'px';
            win.element.style.left = pending.left + 'px';
            win.element.style.top = pending.top + 'px';
          }
          this.saveWindowBounds(win.id);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  toggleMaximize(id) {
    const win = this.windows.get(id);
    if (!win || !win.resizable) return;

    const btnMax = win.element.querySelector('.btn-max');
    const fromCaption = this.captionRect(win);

    if (win.isMaximized) {
      win.element.classList.remove('maximized');
      win.element.style.left = win.prevBounds.x + 'px';
      win.element.style.top = win.prevBounds.y + 'px';
      win.element.style.width = win.prevBounds.width + 'px';
      win.element.style.height = win.prevBounds.height + 'px';
      win.isMaximized = false;
      if (btnMax) {
        btnMax.innerHTML = Icons['cap-max'];
        btnMax.title = window.i18n ? window.i18n.t('win.maximize') : 'Maximize';
      }
    } else {
      const rect = win.element.getBoundingClientRect();
      win.prevBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
      win.element.classList.add('maximized');
      win.isMaximized = true;
      if (btnMax) {
        btnMax.innerHTML = Icons['cap-restore'];
        btnMax.title = window.i18n ? window.i18n.t('win.restore') : 'Restore';
      }
    }
    this.animateCaption(fromCaption, this.captionRect(win));
    this.saveWindowBounds(id);
  }

  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    const fromCaption = win.isMinimized ? null : this.captionRect(win);
    win.isMinimized = true;
    win.element.classList.add('minimized');
    this.animateCaption(fromCaption, this.taskbarButtonRect(id));

    if (window.taskbar) {
      window.taskbar.updateActiveState(null);
    }

    let nextWin = null;
    let maxZ = -1;
    this.windows.forEach(w => {
      if (w.id !== id && !w.isMinimized && parseInt(w.element.style.zIndex || 0) > maxZ) {
        maxZ = parseInt(w.element.style.zIndex || 0);
        nextWin = w;
      }
    });

    if (nextWin) {
      this.bringToTop(nextWin.id);
    } else {
      this.activeWindowId = null;
    }
  }

  restoreWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    const fromButton = win.isMinimized ? this.taskbarButtonRect(id) : null;
    win.isMinimized = false;
    win.element.classList.remove('minimized');
    this.animateCaption(fromButton, this.captionRect(win));
    this.bringToTop(id);
  }

  captionRect(win) {
    if (!this.effectOn('fx-animate') || !win || !win.element.getBoundingClientRect) return null;
    const r = win.element.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left + 3, top: r.top + 3, width: Math.max(0, r.width - 6) };
  }

  taskbarButtonRect(id) {
    if (!this.effectOn('fx-animate')) return null;
    const btn = window.taskbar && window.taskbar.windowButtons && window.taskbar.windowButtons.get(id);
    if (!btn || !btn.getBoundingClientRect) return null;
    const r = btn.getBoundingClientRect();
    if (!r.width || r.top >= window.innerHeight) return null;
    return { left: r.left, top: r.top + (r.height - 18) / 2, width: r.width };
  }

  animateCaption(from, to) {
    if (!from || !to) return;
    const caption = document.createElement('div');
    caption.className = 'win-zoom-caption';
    document.body.appendChild(caption);
    if (typeof caption.animate !== 'function') {
      caption.remove();
      return;
    }
    const box = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    const run = caption.animate([box(from), box(to)], { duration: 220, easing: 'ease-in-out', fill: 'forwards' });
    run.onfinish = () => caption.remove();
    run.oncancel = () => caption.remove();
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;
    if (win.beforeClose && win.beforeClose() === false) return;
    this.saveWindowBounds(id);

    if (win.onClose) {
      win.onClose();
    }

    try {
      win.element.dispatchEvent(new CustomEvent('window-close'));
    } catch (e) {}

    if (window.taskbar) {
      window.taskbar.removeWindow(id);
    }

    win.element.remove();
    this.windows.delete(id);

    let nextWin = null;
    let maxZ = -1;
    this.windows.forEach(w => {
      if (!w.isMinimized && parseInt(w.element.style.zIndex || 0) > maxZ) {
        maxZ = parseInt(w.element.style.zIndex || 0);
        nextWin = w;
      }
    });

    if (nextWin) {
      this.bringToTop(nextWin.id);
    } else {
      this.activeWindowId = null;
    }
  }

  showSystemMenu(id, x, y) {
    const win = this.windows.get(id);
    if (!win || !window.contextMenu) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const btnMin = win.element.querySelector('.btn-min');
    const btnMax = win.element.querySelector('.btn-max');
    const canMaximize = !!btnMax && win.resizable;
    window.contextMenu.show(x, y, [
      { label: t('win.restore'), disabled: !win.isMaximized, action: () => this.toggleMaximize(id) },
      { label: t('win.move'), disabled: true },
      { label: t('win.size'), disabled: true },
      { label: t('win.minimize'), disabled: !btnMin, action: () => this.minimizeWindow(id) },
      { label: t('win.maximize'), disabled: !canMaximize || win.isMaximized, action: () => this.toggleMaximize(id) },
      { separator: true },
      { label: t('win.close'), bold: true, shortcut: 'Alt+F4', action: () => this.closeWindow(id) }
    ]);
  }

  minimizeAll() {
    this.windows.forEach(win => {
      if (!win.isMinimized) {
        this.minimizeWindow(win.id);
      }
    });
  }

  minimizeAllWindows() {
    this.minimizeAll();
  }

  cascadeWindows() {
    let offset = 20;
    this.windows.forEach(win => {
      if (win.isMinimized) {
        this.restoreWindow(win.id);
      }
      if (win.isMaximized) {
        this.toggleMaximize(win.id);
      }
      win.element.style.left = offset + 'px';
      win.element.style.top = offset + 'px';
      win.element.style.width = '480px';
      win.element.style.height = '340px';
      this.bringToTop(win.id);
      offset += 25;
    });
  }

  tileWindows(vertical = false) {
    const visibleWins = Array.from(this.windows.values()).filter(w => !w.isMinimized);
    if (visibleWins.length === 0) return;
    const count = visibleWins.length;
    const desktopW = window.innerWidth;
    const desktopH = window.innerHeight - 30;

    visibleWins.forEach((win, idx) => {
      if (win.isMaximized) this.toggleMaximize(win.id);
      if (vertical) {
        const w = Math.floor(desktopW / count);
        win.element.style.left = (idx * w) + 'px';
        win.element.style.top = '0px';
        win.element.style.width = w + 'px';
        win.element.style.height = desktopH + 'px';
      } else {
        const h = Math.floor(desktopH / count);
        win.element.style.left = '0px';
        win.element.style.top = (idx * h) + 'px';
        win.element.style.width = desktopW + 'px';
        win.element.style.height = h + 'px';
      }
    });
  }

  openDialog({
    title = '',
    icon = 'info',
    message = '',
    buttons = [{ text: 'OK', primary: true, onClick: null }],
    width = 380
  }) {
    if (!title && window.i18n) {
      title = window.i18n.t('about.title');
    } else if (!title) {
      title = 'System Message';
    }

    if (window.soundSys) {
      if (icon === 'warning' || icon === 'error') {
        window.soundSys.playError();
      } else {
        window.soundSys.playDing();
      }
    }

    const dialogId = 'dialog_' + Date.now();
    const content = document.createElement('div');
    content.className = 'win-dialog-content';

    const msgRow = document.createElement('div');
    msgRow.className = 'win-dialog-message-row';
    msgRow.innerHTML = `
      <div class="win-dialog-icon">${Icons[icon] || Icons['info'] || Icons['warning']}</div>
      <div class="win-dialog-text">${message}</div>
    `;
    content.appendChild(msgRow);

    const btnRow = document.createElement('div');
    btnRow.className = 'win-dialog-buttons is-msgbox';

    buttons.forEach((b, idx) => {
      const btn = document.createElement('button');
      btn.className = 'win-btn';

      let label = b.text;
      if (window.i18n) {
        if (label === 'OK') label = window.i18n.t('btn.ok');
        else if (label === 'Cancel') label = window.i18n.t('btn.cancel');
        else if (label === 'Yes') label = window.i18n.t('btn.yes');
        else if (label === 'No') label = window.i18n.t('btn.no');
      }

      btn.textContent = label;
      if (b.primary || b.isDefault) btn.classList.add('is-default');
      btn.addEventListener('click', () => {
        if (typeof b.onClick === 'function') b.onClick();
        else if (typeof b.action === 'function') b.action();
        this.closeWindow(dialogId);
      });
      btnRow.appendChild(btn);
    });

    content.appendChild(btnRow);

    const dialogButtons = [...btnRow.querySelectorAll('.win-btn')];
    const defaultButton = btnRow.querySelector('.win-btn.is-default') || dialogButtons[0];
    const cancelButton = dialogButtons.length > 1 ? dialogButtons[dialogButtons.length - 1] : dialogButtons[0];
    content.tabIndex = -1;
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && defaultButton && !e.target.closest('.win-btn')) {
        e.preventDefault();
        defaultButton.click();
      } else if (e.key === 'Escape' && cancelButton) {
        e.preventDefault();
        cancelButton.click();
      }
    });
    setTimeout(() => {
      if (defaultButton && defaultButton.isConnected) defaultButton.focus();
    }, 0);

    const dialogWidth = typeof width === 'number' ? width : 380;
    const height = 'auto';
    const x = (window.innerWidth - dialogWidth) / 2;
    const y = (window.innerHeight - 180) / 2.5;

    return this.createWindow({
      id: dialogId,
      title,
      icon,
      width: dialogWidth,
      height,
      x,
      y,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
  }

  openPromptDialog({
    title = '',
    icon = 'folder',
    message = '',
    value = '',
    placeholder = '',
    okText = 'OK',
    cancelText = 'Cancel',
    onOk = null,
    onCancel = null
  }) {
    if (!title && window.i18n) {
      title = window.i18n.t('about.title');
    } else if (!title) {
      title = 'Input';
    }

    if (window.soundSys) {
      window.soundSys.playDing();
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    let resolvedOkText = okText;
    let resolvedCancelText = cancelText;
    if (window.i18n) {
      if (okText === 'OK') resolvedOkText = t('btn.ok');
      if (cancelText === 'Cancel') resolvedCancelText = t('btn.cancel');
    }

    const dialogId = 'prompt_' + Date.now();
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.padding = '12px 14px';
    content.style.minWidth = '340px';

    const safeVal = String(value || '').replace(/"/g, '&quot;');
    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div class="win-dialog-icon" style="width:32px; height:32px; flex-shrink:0;">${Icons[icon] || Icons['folder'] || Icons['info']}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; margin-bottom:8px; line-height:1.4;">${message}</div>
          <input type="text" class="win-prompt-input" style="width:100%; box-sizing:border-box; font-family:var(--win-font, Tahoma, sans-serif); font-size:11px; padding:3px 4px; border:2px inset #ffffff; background:#ffffff;" value="${safeVal}" placeholder="${placeholder}">
        </div>
      </div>
      <div class="win-dialog-buttons" style="margin-top:14px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn is-default btn-prompt-ok" style="min-width:70px;">${resolvedOkText}</button>
        <button class="win-btn btn-prompt-cancel" style="min-width:70px;">${resolvedCancelText}</button>
      </div>
    `;

    const width = 380;
    const height = 'auto';
    const x = (window.innerWidth - width) / 2;
    const y = (window.innerHeight - 160) / 2.5;

    const dialog = this.createWindow({
      id: dialogId,
      title,
      icon,
      width,
      height,
      x,
      y,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const input = el.querySelector('.win-prompt-input');
    const btnOk = el.querySelector('.btn-prompt-ok');
    const btnCancel = el.querySelector('.btn-prompt-cancel');

    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);

    const submit = () => {
      const val = input ? input.value : '';
      this.closeWindow(dialogId);
      if (typeof onOk === 'function') onOk(val);
    };

    const cancel = () => {
      this.closeWindow(dialogId);
      if (typeof onCancel === 'function') onCancel();
    };

    btnOk.addEventListener('click', submit);
    btnCancel.addEventListener('click', cancel);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    return dialog;
  }

  setupMenubarInteractions(winEl) {
    const alignDropdown = (menuItem) => {
      const dropdown = menuItem.querySelector('.win-menu-dropdown');
      if (!dropdown) return;
      dropdown.style.left = '0';
      dropdown.style.right = 'auto';
      const rect = dropdown.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
      }
    };

    winEl.addEventListener('click', (e) => {
      const option = e.target.closest('.win-dropdown-option');
      if (option) {
        if (window.soundSys && window.soundSys.playClick) {
          window.soundSys.playClick();
        }
        winEl.querySelectorAll('.win-menu-item.active').forEach(m => m.classList.remove('active'));
        return;
      }

      const menuItem = e.target.closest('.win-menu-item');
      if (menuItem) {
        e.stopPropagation();
        const wasActive = menuItem.classList.contains('active');
        winEl.querySelectorAll('.win-menu-item.active').forEach(m => m.classList.remove('active'));
        if (!wasActive) {
          menuItem.classList.add('active');
          alignDropdown(menuItem);
          if (window.soundSys && window.soundSys.playClick) {
            window.soundSys.playClick();
          }
        }
        return;
      }

      winEl.querySelectorAll('.win-menu-item.active').forEach(m => m.classList.remove('active'));
    });

    winEl.addEventListener('mouseover', (e) => {
      const menubar = e.target.closest('.win-menubar, [class*="-menubar"]');
      if (!menubar) return;
      const anyActive = menubar.querySelector('.win-menu-item.active');
      if (!anyActive) return;

      const menuItem = e.target.closest('.win-menu-item');
      if (menuItem && menuItem !== anyActive) {
        anyActive.classList.remove('active');
        menuItem.classList.add('active');
        alignDropdown(menuItem);
      }
    });
  }
}

window.winManager = new WindowManager();
