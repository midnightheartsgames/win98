(function (B) {
  'use strict';
  globalThis.appBTTF = {
    open() {
      const id = 'app_bttf';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(676, window.innerWidth - 30), h = Math.min(548, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Back to the Future: The Game', icon: 'bttf', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 20, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new B.UI(root, {
        ep: B.EP1,
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.BTTF = globalThis.BTTF || {});
