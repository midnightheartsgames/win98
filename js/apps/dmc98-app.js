(function (S) {
  'use strict';
  globalThis.appDmc98 = {
    open() {
      const id = 'app_dmc98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1000, window.innerWidth - 30), h = Math.min(700, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Devil May Cry 98 Demo', icon: 'dmc98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
