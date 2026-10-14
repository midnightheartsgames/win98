(function (O) {
  'use strict';
  globalThis.appOw98 = {
    open() {
      const id = 'app_ow98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1024, window.innerWidth - 30), h = Math.min(700, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Overwatch 98', icon: 'ow98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new O.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
