(function (HO) {
  'use strict';
  globalThis.appHsro = {
    open() {
      const gm = window.gameManager;
      if (gm && !gm.isInstalled('hsro')) { gm.showInSteam('hsro'); return; }
      const id = 'app_hsro', wm = window.winManager;
      if (wm.windows.has(id)) {
        if (wm.windows.get(id).isMinimized) wm.restoreWindow(id);
        else wm.bringToTop(id);
        return;
      }
      const root = document.createElement('div');
      root.style.width = '100%';
      root.style.height = '100%';
      const w = Math.min(1024, window.innerWidth - 20), h = Math.min(800, window.innerHeight - 50);
      wm.createWindow({
        id, title: HO.TITLE, icon: 'hsro', width: w, height: h, minWidth: 640, minHeight: 480,
        x: Math.max(10, Math.round((window.innerWidth - w) / 2)), y: Math.max(10, Math.round((window.innerHeight - h) / 2) - 20), content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new HO.UI(root, { isActive: () => wm.isTopWindow(id), onExit: () => wm.closeWindow(id) });
    }
  };
})(globalThis.HO = globalThis.HO || {});
