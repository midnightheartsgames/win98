(function (C) {
  'use strict';
  globalThis.appCatniss = {
    open() {
      const id = 'app_catniss';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(668, window.innerWidth - 30), h = Math.min(536, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Catniss', icon: 'catniss', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 16, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new C.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Catniss = globalThis.Catniss || {});
