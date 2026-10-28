(function (D) {
  'use strict';
  globalThis.appDao98 = {
    open() {
      const id = 'app_dao98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1040, window.innerWidth - 30), h = Math.min(760, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Dragon Age: Origins 98 Demo', icon: 'dao98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new D.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Dao98 = globalThis.Dao98 || {});
