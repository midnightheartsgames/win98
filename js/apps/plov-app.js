(function (P) {
  'use strict';
  globalThis.appPlov = {
    open() {
      const id = 'app_plov';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(820, window.innerWidth - 30), h = Math.min(650, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Хаято, Где плов?', icon: 'plov', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 12, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new P.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Plov = globalThis.Plov || {});
