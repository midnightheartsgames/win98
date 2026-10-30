(function (H) {
  'use strict';
  globalThis.appHeroes98 = {
    open() {
      const id = 'app_heroes98', wm = window.winManager;
      if (wm.windows.has(id)) {
        if (wm.windows.get(id).isMinimized) wm.restoreWindow(id);
        else wm.bringToTop(id);
        return;
      }
      const root = document.createElement('div');
      const w = Math.min(806, window.innerWidth - 20), h = Math.min(626, window.innerHeight - 50);
      wm.createWindow({
        id, title: H.TITLE, icon: 'heroes98', width: w, height: h, minWidth: 340, minHeight: 280,
        x: Math.max(10, Math.round((window.innerWidth - w) / 2)), y: Math.max(10, Math.round((window.innerHeight - h) / 2) - 20), content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new H.UI(root, { isActive: () => wm.isTopWindow(id), onExit: () => wm.closeWindow(id) });
    }
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
