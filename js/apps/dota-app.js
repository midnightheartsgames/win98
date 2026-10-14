(function (D) {
  'use strict';
  globalThis.appDota = {
    open() {
      const id = 'app_dota';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1000, window.innerWidth - 30), h = Math.min(780, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Dota 98', icon: 'dota', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new D.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Dota98 = globalThis.Dota98 || {});
