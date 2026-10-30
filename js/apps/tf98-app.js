(function (T) {
  'use strict';
  globalThis.appTf98 = {
    open() {
      const id = 'app_tf98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1024, window.innerWidth - 30), h = Math.min(700, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Team Fortress 98', icon: 'tf98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new T.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow(id)
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Tf98 = globalThis.Tf98 || {});
