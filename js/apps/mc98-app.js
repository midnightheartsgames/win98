(function (M) {
  'use strict';
  globalThis.appMc98 = {
    open() {
      const id = 'app_mc98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1000, window.innerWidth - 30), h = Math.min(720, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Minecraft 98 Demo', icon: 'mc98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new M.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Mc98 = globalThis.Mc98 || {});
